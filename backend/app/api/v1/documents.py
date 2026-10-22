import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import StreamingResponse, RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.models import FDRRecord, Document, User
from app.schemas.schemas import DocumentResponse
from app.security.auth import get_current_user, verify_institution_access
from app.storage.storage import get_storage
from app.services.audit import log_audit

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload/{fdr_id}", response_model=DocumentResponse)
async def upload_document(
    fdr_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fdr = db.query(FDRRecord).filter(FDRRecord.id == fdr_id).first()
    if not fdr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FDR record not found")

    verify_institution_access(current_user, fdr.institution_id)

    # Check file size limit
    file_bytes = await file.read()
    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES / (1024*1024)} MB"
        )
    if len(file_bytes) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot upload empty file")

    storage = get_storage()
    content_type = file.content_type or "application/octet-stream"
    storage_key, safe_filename = storage.save_file(file_bytes, file.filename or "fdr_document.pdf", content_type)

    storage_provider_name = "S3" if settings.USE_AWS_S3 else "LOCAL"

    doc = Document(
        fdr_id=fdr.id,
        storage_provider=storage_provider_name,
        storage_key=storage_key,
        original_filename=file.filename or "fdr_document.pdf",
        safe_filename=safe_filename,
        file_type=content_type,
        file_size=len(file_bytes),
        upload_metadata={"uploaded_by": current_user.email}
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    log_audit(
        db,
        action="UPLOAD_DOCUMENT",
        entity_type="Document",
        entity_id=str(doc.id),
        actor=current_user,
        metadata_json={"fdr_id": fdr.id, "filename": doc.original_filename, "size": doc.file_size}
    )

    url = storage.get_download_url(doc.storage_key, doc.original_filename)

    return DocumentResponse(
        id=doc.id,
        fdr_id=doc.fdr_id,
        storage_provider=doc.storage_provider,
        storage_key=doc.storage_key,
        original_filename=doc.original_filename,
        file_type=doc.file_type,
        file_size=doc.file_size,
        created_at=doc.created_at,
        download_url=url
    )

@router.get("/download/{storage_key}")
def download_document(
    storage_key: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        (Document.storage_key == storage_key) | 
        (Document.original_filename == storage_key) |
        (Document.safe_filename == storage_key)
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document metadata not found")

    fdr = db.query(FDRRecord).filter(FDRRecord.id == doc.fdr_id).first()
    if not fdr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FDR record associated with document not found")

    verify_institution_access(current_user, fdr.institution_id)

    storage = get_storage()
    # If S3 presigned URL is returned, redirect
    url = storage.get_download_url(doc.storage_key, doc.original_filename)
    if url and url.startswith("http"):
        return RedirectResponse(url=url)

    file_bytes, content_type = storage.get_file_content(doc.storage_key)
    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type=content_type,
        headers={"Content-Disposition": f'inline; filename="{doc.original_filename}"'}
    )
