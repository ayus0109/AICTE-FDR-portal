from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.models.models import User, Institution
from app.schemas.schemas import UserResponse, UserCreate
from app.security.auth import require_roles, get_password_hash
from app.services.audit import log_audit

router = APIRouter(prefix="/users", tags=["User Management"])

@router.get("", response_model=List[UserResponse])
def get_users(
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    users = db.query(User).order_by(desc(User.created_at)).all()
    results = []
    for u in users:
        inst_name = None
        if u.institution_id:
            inst = db.query(Institution).filter(Institution.id == u.institution_id).first()
            if inst:
                inst_name = inst.name
        results.append(UserResponse(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            institution_id=u.institution_id,
            is_active=u.is_active,
            created_at=u.created_at,
            institution_name=inst_name
        ))
    return results

@router.post("", response_model=UserResponse)
def create_user(
    data: UserCreate,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        name=data.name,
        email=data.email,
        password_hash=get_password_hash(data.password),
        role=data.role,
        institution_id=data.institution_id,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_audit(db, action="CREATE_USER", entity_type="User", entity_id=str(user.id), actor=current_user)

    inst_name = None
    if user.institution_id:
        inst = db.query(Institution).filter(Institution.id == user.institution_id).first()
        if inst:
            inst_name = inst.name

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        institution_id=user.institution_id,
        is_active=user.is_active,
        created_at=user.created_at,
        institution_name=inst_name
    )

@router.put("/{id}/status")
def toggle_user_status(
    id: int,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot deactivate own account")

    user.is_active = not user.is_active
    db.commit()

    log_audit(
        db,
        action="TOGGLE_USER_STATUS",
        entity_type="User",
        entity_id=str(user.id),
        actor=current_user,
        metadata_json={"new_status": user.is_active}
    )

    return {"status": "success", "id": user.id, "is_active": user.is_active}
