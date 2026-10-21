from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.models import Institution, User, FDRRecord
from app.schemas.schemas import InstitutionResponse, InstitutionCreate
from app.security.auth import get_current_user, require_roles, verify_institution_access
from app.services.audit import log_audit

router = APIRouter(prefix="/institutions", tags=["Institutions"])

@router.get("", response_model=List[InstitutionResponse])
def get_institutions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    List institutions. Officers/Admins see all; College user sees only their assigned institution.
    """
    if current_user.role == "COLLEGE_USER":
        if not current_user.institution_id:
            return []
        institutions = db.query(Institution).filter(Institution.id == current_user.institution_id).all()
    else:
        institutions = db.query(Institution).order_by(Institution.name).all()

    results = []
    for inst in institutions:
        fdr_stats = db.query(
            func.count(FDRRecord.id),
            func.coalesce(func.sum(FDRRecord.amount), 0.0)
        ).filter(FDRRecord.institution_id == inst.id).first()
        
        count = fdr_stats[0] if fdr_stats else 0
        total_amt = float(fdr_stats[1]) if fdr_stats else 0.0

        item = InstitutionResponse(
            id=inst.id,
            name=inst.name,
            aicte_code=inst.aicte_code,
            institution_type=inst.institution_type,
            address=inst.address,
            state=inst.state,
            contact_person=inst.contact_person,
            email=inst.email,
            phone=inst.phone,
            status=inst.status,
            created_at=inst.created_at,
            fdr_count=count,
            total_fdr_amount=total_amt
        )
        results.append(item)
    return results

@router.get("/{id}", response_model=InstitutionResponse)
def get_institution(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    verify_institution_access(current_user, id)
    inst = db.query(Institution).filter(Institution.id == id).first()
    if not inst:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution not found")
        
    fdr_stats = db.query(
        func.count(FDRRecord.id),
        func.coalesce(func.sum(FDRRecord.amount), 0.0)
    ).filter(FDRRecord.institution_id == inst.id).first()

    return InstitutionResponse(
        id=inst.id,
        name=inst.name,
        aicte_code=inst.aicte_code,
        institution_type=inst.institution_type,
        address=inst.address,
        state=inst.state,
        contact_person=inst.contact_person,
        email=inst.email,
        phone=inst.phone,
        status=inst.status,
        created_at=inst.created_at,
        fdr_count=fdr_stats[0] if fdr_stats else 0,
        total_fdr_amount=float(fdr_stats[1]) if fdr_stats else 0.0
    )

@router.post("", response_model=InstitutionResponse)
def create_institution(
    data: InstitutionCreate,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    existing = db.query(Institution).filter(Institution.aicte_code == data.aicte_code).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="AICTE Code already registered")

    inst = Institution(**data.model_dump())
    db.add(inst)
    db.commit()
    db.refresh(inst)

    log_audit(db, action="CREATE_INSTITUTION", entity_type="Institution", entity_id=str(inst.id), actor=current_user)
    return inst
