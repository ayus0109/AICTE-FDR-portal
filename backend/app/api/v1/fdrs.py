import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.db.session import get_db
from app.models.models import FDRRecord, Institution, User, VerificationRecord, Document, Notification
from app.schemas.schemas import FDRCreate, FDRResponse, VerificationCreate, VerificationResponse, DocumentResponse
from app.security.auth import get_current_user, require_roles, verify_institution_access
from app.services.audit import log_audit
from app.notifications.service import NotificationService
from app.storage.storage import get_storage

router = APIRouter(prefix="/fdrs", tags=["FDR Management"])

def _enrich_fdr(fdr: FDRRecord, db: Session) -> FDRResponse:
    today = datetime.datetime.utcnow().date()
    maturity_date = fdr.maturity_date.date() if isinstance(fdr.maturity_date, datetime.datetime) else fdr.maturity_date
    days_to_maturity = (maturity_date - today).days

    # Date-derived maturity status synchronization
    if days_to_maturity < 0:
        calculated_mat_status = "MATURED"
    elif days_to_maturity <= 30:
        calculated_mat_status = "APPROACHING_MATURITY"
    else:
        calculated_mat_status = "ACTIVE"

    storage = get_storage()
    doc_responses = []
    for doc in fdr.documents:
        url = storage.get_download_url(doc.storage_key, doc.original_filename)
        doc_responses.append(DocumentResponse(
            id=doc.id,
            fdr_id=doc.fdr_id,
            storage_provider=doc.storage_provider,
            storage_key=doc.storage_key,
            original_filename=doc.original_filename,
            file_type=doc.file_type,
            file_size=doc.file_size,
            created_at=doc.created_at,
            download_url=url
        ))

    ver_responses = []
    for v in fdr.verifications:
        rev_name = v.reviewer.name if v.reviewer else "Officer"
        ver_responses.append(VerificationResponse(
            id=v.id,
            fdr_id=v.fdr_id,
            reviewer_id=v.reviewer_id,
            reviewer_name=rev_name,
            verification_method=v.verification_method,
            outcome=v.outcome,
            observations=v.observations,
            supporting_reference=v.supporting_reference,
            created_at=v.created_at
        ))

    return FDRResponse(
        id=fdr.id,
        institution_id=fdr.institution_id,
        institution_name=fdr.institution.name if fdr.institution else None,
        aicte_code=fdr.institution.aicte_code if fdr.institution else None,
        fdr_number=fdr.fdr_number,
        bank_name=fdr.bank_name,
        branch_name=fdr.branch_name,
        amount=fdr.amount,
        currency=fdr.currency,
        issue_date=fdr.issue_date,
        maturity_date=fdr.maturity_date,
        deposit_type=fdr.deposit_type,
        administrative_status=fdr.administrative_status,
        maturity_status=calculated_mat_status,
        verification_status=fdr.verification_status,
        scrutiny_remarks=fdr.scrutiny_remarks,
        original_fdr_id=fdr.original_fdr_id,
        days_to_maturity=days_to_maturity,
        documents=doc_responses,
        verifications=ver_responses,
        created_at=fdr.created_at,
        updated_at=fdr.updated_at
    )

@router.get("", response_model=List[FDRResponse])
def get_fdrs(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,
    maturity_status: Optional[str] = None,
    bank: Optional[str] = None,
    institution_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(FDRRecord)

    # STRICT RBAC & Institutional Isolation
    if current_user.role == "COLLEGE_USER":
        if not current_user.institution_id:
            return []
        query = query.filter(FDRRecord.institution_id == current_user.institution_id)
    elif institution_id:
        query = query.filter(FDRRecord.institution_id == institution_id)

    if search:
        search_filter = f"%{search}%"
        query = query.join(Institution).filter(
            or_(
                FDRRecord.fdr_number.ilike(search_filter),
                FDRRecord.bank_name.ilike(search_filter),
                FDRRecord.branch_name.ilike(search_filter),
                Institution.name.ilike(search_filter),
                Institution.aicte_code.ilike(search_filter)
            )
        )

    if status and status != "ALL":
        query = query.filter(FDRRecord.administrative_status == status)

    if bank and bank != "ALL":
        query = query.filter(FDRRecord.bank_name == bank)

    fdrs = query.order_by(desc(FDRRecord.created_at)).offset(skip).limit(limit).all()
    
    enriched = [_enrich_fdr(f, db) for f in fdrs]
    
    if maturity_status and maturity_status != "ALL":
        enriched = [e for e in enriched if e.maturity_status == maturity_status]

    return enriched

@router.get("/{id}", response_model=FDRResponse)
def get_fdr(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fdr = db.query(FDRRecord).filter(FDRRecord.id == id).first()
    if not fdr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FDR record not found")
    
    verify_institution_access(current_user, fdr.institution_id)
    return _enrich_fdr(fdr, db)

@router.post("", response_model=FDRResponse)
def create_fdr(
    data: FDRCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Determine target institution
    if current_user.role == "COLLEGE_USER":
        if not current_user.institution_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is not linked to any institution")
        target_inst_id = current_user.institution_id
    else:
        if not data.institution_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Institution ID required")
        target_inst_id = data.institution_id

    # Validation: Maturity date must not be earlier than issue date
    if data.maturity_date < data.issue_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Validation Error: Maturity date cannot be earlier than Issue date."
        )

    # Validation: Positive amount
    if data.amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Deposit amount must be greater than zero.")

    # Duplicate check flag
    existing = db.query(FDRRecord).filter(
        FDRRecord.fdr_number == data.fdr_number,
        FDRRecord.bank_name == data.bank_name
    ).first()
    if existing:
        # Flag possible duplicate for review
        scrutiny_initial = f"Notice: Duplicate reference number {data.fdr_number} at {data.bank_name} detected."
    else:
        scrutiny_initial = None

    issue_dt = datetime.datetime.combine(data.issue_date, datetime.time())
    maturity_dt = datetime.datetime.combine(data.maturity_date, datetime.time())

    fdr = FDRRecord(
        institution_id=target_inst_id,
        fdr_number=data.fdr_number.strip(),
        bank_name=data.bank_name.strip(),
        branch_name=data.branch_name.strip(),
        amount=data.amount,
        currency=data.currency,
        issue_date=issue_dt,
        maturity_date=maturity_dt,
        deposit_type=data.deposit_type,
        administrative_status="SUBMITTED",
        maturity_status="ACTIVE",
        verification_status="PENDING",
        scrutiny_remarks=scrutiny_initial,
        original_fdr_id=data.original_fdr_id,
        submission_date=datetime.datetime.utcnow(),
        submitted_by_id=current_user.id
    )
    db.add(fdr)
    db.commit()
    db.refresh(fdr)

    log_audit(
        db,
        action="CREATE_FDR",
        entity_type="FDRRecord",
        entity_id=str(fdr.id),
        actor=current_user,
        metadata_json={"fdr_number": fdr.fdr_number, "amount": fdr.amount, "bank": fdr.bank_name}
    )

    # Notify Officers of new submission
    inst_name = fdr.institution.name if fdr.institution else f"Institution #{target_inst_id}"
    NotificationService.notify_officers(
        db=db,
        subject=f"New FDR Submission: {fdr.fdr_number}",
        message=f"{inst_name} has submitted a new FDR ({fdr.fdr_number}) of ₹{fdr.amount:,.2f} at {fdr.bank_name} for scrutiny.",
        notification_type="SCRUTINY_UPDATE",
        fdr_id=fdr.id
    )

    return _enrich_fdr(fdr, db)

@router.post("/{id}/verify", response_model=FDRResponse)
def verify_fdr(
    id: int,
    data: VerificationCreate,
    current_user: User = Depends(require_roles(["AICTE_OFFICER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    fdr = db.query(FDRRecord).filter(FDRRecord.id == id).first()
    if not fdr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FDR record not found")

    allowed_outcomes = ["VERIFIED", "CLARIFICATION_REQUIRED", "DISCREPANCY_DETECTED", "REJECTED"]
    if data.outcome not in allowed_outcomes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid outcome. Allowed: {', '.join(allowed_outcomes)}"
        )

    # Record verification entry
    verification = VerificationRecord(
        fdr_id=fdr.id,
        reviewer_id=current_user.id,
        verification_method=data.verification_method,
        outcome=data.outcome,
        observations=data.observations,
        supporting_reference=data.supporting_reference,
        created_at=datetime.datetime.utcnow()
    )
    db.add(verification)

    # Update FDR administrative status
    fdr.administrative_status = data.outcome
    fdr.verification_status = data.outcome
    fdr.scrutiny_remarks = data.observations
    fdr.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(fdr)

    log_audit(
        db,
        action=f"VERIFY_FDR_{data.outcome}",
        entity_type="FDRRecord",
        entity_id=str(fdr.id),
        actor=current_user,
        metadata_json={
            "outcome": data.outcome,
            "observations": data.observations,
            "method": data.verification_method
        }
    )

    # Notify Institution Users
    inst_users = db.query(User).filter(User.institution_id == fdr.institution_id).all()
    for u in inst_users:
        NotificationService.send_notification(
            db=db,
            recipient_id=u.id,
            subject=f"Scrutiny Update on FDR {fdr.fdr_number}: {data.outcome}",
            message=f"Your FDR {fdr.fdr_number} status has been updated to {data.outcome}. Remarks: {data.observations}",
            notification_type="SCRUTINY_UPDATE",
            fdr_id=fdr.id
        )

    return _enrich_fdr(fdr, db)
