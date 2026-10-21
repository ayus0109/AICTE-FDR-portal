import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.models.models import ReleaseRequest, FDRRecord, Institution, User
from app.schemas.schemas import ReleaseRequestCreate, ReleaseRequestUpdate, ReleaseRequestResponse
from app.security.auth import get_current_user, require_roles, verify_institution_access
from app.services.audit import log_audit
from app.notifications.service import NotificationService

router = APIRouter(prefix="/releases", tags=["Release and Refund"])

@router.get("", response_model=List[ReleaseRequestResponse])
def get_release_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ReleaseRequest).join(Institution, ReleaseRequest.institution_id == Institution.id)

    if current_user.role == "COLLEGE_USER":
        if not current_user.institution_id:
            return []
        query = query.filter(ReleaseRequest.institution_id == current_user.institution_id)

    requests = query.order_by(desc(ReleaseRequest.created_at)).all()

    results = []
    for r in requests:
        fdr = db.query(FDRRecord).filter(FDRRecord.id == r.fdr_id).first()
        inst = db.query(Institution).filter(Institution.id == r.institution_id).first()
        req_user = db.query(User).filter(User.id == r.requester_id).first() if r.requester_id else None
        rev_user = db.query(User).filter(User.id == r.reviewer_id).first() if r.reviewer_id else None

        results.append(ReleaseRequestResponse(
            id=r.id,
            fdr_id=r.fdr_id,
            fdr_number=fdr.fdr_number if fdr else None,
            institution_id=r.institution_id,
            institution_name=inst.name if inst else None,
            amount=fdr.amount if fdr else None,
            requester_id=r.requester_id,
            requester_name=req_user.name if req_user else None,
            reason=r.reason,
            status=r.status,
            reviewer_id=r.reviewer_id,
            reviewer_name=rev_user.name if rev_user else None,
            remarks=r.remarks,
            created_at=r.created_at,
            updated_at=r.updated_at
        ))
    return results

@router.post("", response_model=ReleaseRequestResponse)
def create_release_request(
    data: ReleaseRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fdr = db.query(FDRRecord).filter(FDRRecord.id == data.fdr_id).first()
    if not fdr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FDR record not found")

    verify_institution_access(current_user, fdr.institution_id)

    # Check if there is already an active release request for this FDR
    existing = db.query(ReleaseRequest).filter(
        ReleaseRequest.fdr_id == fdr.id,
        ReleaseRequest.status.in_(["SUBMITTED", "UNDER_REVIEW", "CLARIFICATION_REQUIRED"])
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An active release request is already pending review for this FDR record."
        )

    req = ReleaseRequest(
        fdr_id=fdr.id,
        institution_id=fdr.institution_id,
        requester_id=current_user.id,
        reason=data.reason,
        status="SUBMITTED",
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow()
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    log_audit(
        db,
        action="REQUEST_FDR_RELEASE",
        entity_type="ReleaseRequest",
        entity_id=str(req.id),
        actor=current_user,
        metadata_json={"fdr_id": fdr.id, "fdr_number": fdr.fdr_number, "reason": data.reason}
    )

    inst_name = fdr.institution.name if fdr.institution else f"Institution #{fdr.institution_id}"
    NotificationService.notify_officers(
        db=db,
        subject=f"Security Deposit Release Request: FDR {fdr.fdr_number}",
        message=f"{inst_name} has requested administrative release of FDR {fdr.fdr_number} (₹{fdr.amount:,.2f}). Reason: {data.reason}",
        notification_type="RELEASE_UPDATE",
        fdr_id=fdr.id
    )

    return ReleaseRequestResponse(
        id=req.id,
        fdr_id=fdr.id,
        fdr_number=fdr.fdr_number,
        institution_id=fdr.institution_id,
        institution_name=inst_name,
        amount=fdr.amount,
        requester_id=current_user.id,
        requester_name=current_user.name,
        reason=req.reason,
        status=req.status,
        reviewer_id=None,
        reviewer_name=None,
        remarks=None,
        created_at=req.created_at,
        updated_at=req.updated_at
    )

@router.put("/{id}/review", response_model=ReleaseRequestResponse)
def review_release_request(
    id: int,
    data: ReleaseRequestUpdate,
    current_user: User = Depends(require_roles(["AICTE_OFFICER", "ADMIN"])),
    db: Session = Depends(get_db)
):
    req = db.query(ReleaseRequest).filter(ReleaseRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Release request not found")

    valid_statuses = ["UNDER_REVIEW", "CLARIFICATION_REQUIRED", "APPROVED", "REJECTED", "COMPLETED"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status. Allowed: {valid_statuses}")

    req.status = data.status
    req.reviewer_id = current_user.id
    req.remarks = data.remarks
    req.updated_at = datetime.datetime.utcnow()
    
    # If approved, update FDR status to RELEASE_APPROVED
    fdr = db.query(FDRRecord).filter(FDRRecord.id == req.fdr_id).first()
    if fdr and data.status == "APPROVED":
        fdr.administrative_status = "RELEASE_APPROVED"
        fdr.scrutiny_remarks = f"Release Approved by AICTE: {data.remarks}"

    db.commit()
    db.refresh(req)

    log_audit(
        db,
        action=f"REVIEW_RELEASE_{data.status}",
        entity_type="ReleaseRequest",
        entity_id=str(req.id),
        actor=current_user,
        metadata_json={"new_status": data.status, "remarks": data.remarks}
    )

    # Notify requester
    if req.requester_id:
        NotificationService.send_notification(
            db=db,
            recipient_id=req.requester_id,
            subject=f"Release Request Status Update: {data.status}",
            message=f"Your release request for FDR {fdr.fdr_number if fdr else id} was marked {data.status}. Remarks: {data.remarks}",
            notification_type="RELEASE_UPDATE",
            fdr_id=req.fdr_id
        )

    inst = db.query(Institution).filter(Institution.id == req.institution_id).first()
    requester = db.query(User).filter(User.id == req.requester_id).first() if req.requester_id else None

    return ReleaseRequestResponse(
        id=req.id,
        fdr_id=req.fdr_id,
        fdr_number=fdr.fdr_number if fdr else None,
        institution_id=req.institution_id,
        institution_name=inst.name if inst else None,
        amount=fdr.amount if fdr else None,
        requester_id=req.requester_id,
        requester_name=requester.name if requester else None,
        reason=req.reason,
        status=req.status,
        reviewer_id=current_user.id,
        reviewer_name=current_user.name,
        remarks=req.remarks,
        created_at=req.created_at,
        updated_at=req.updated_at
    )
