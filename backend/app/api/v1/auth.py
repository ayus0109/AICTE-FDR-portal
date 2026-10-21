from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User, Institution
from app.schemas.schemas import UserLogin, Token, UserResponse
from app.security.auth import verify_password, create_access_token, get_current_user
from app.services.audit import log_audit

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        log_audit(db, action="LOGIN_FAILED", entity_type="User", entity_id=login_data.email, result="FAILURE")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect official email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated. Contact Administrator.")

    institution_name = None
    if user.institution_id:
        inst = db.query(Institution).filter(Institution.id == user.institution_id).first()
        if inst:
            institution_name = inst.name

    token_data = {
        "sub": user.email,
        "role": user.role,
        "name": user.name,
        "institution_id": user.institution_id,
        "institution_name": institution_name,
    }
    access_token = create_access_token(data=token_data)

    log_audit(db, action="LOGIN_SUCCESS", entity_type="User", entity_id=str(user.id), actor=user)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name,
        "email": user.email,
        "institution_id": user.institution_id,
        "institution_name": institution_name,
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    institution_name = None
    if current_user.institution_id:
        inst = db.query(Institution).filter(Institution.id == current_user.institution_id).first()
        if inst:
            institution_name = inst.name
    
    resp = UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        institution_id=current_user.institution_id,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        institution_name=institution_name
    )
    return resp

@router.get("/demo-personas")
def get_demo_personas():
    """Returns quick-login demo credentials for hackathon evaluation."""
    return [
        {
            "role": "COLLEGE_USER",
            "title": "College Institutional Officer",
            "institution": "Delhi Institute of Technology & Science",
            "email": "college@demo.aicte.gov.in",
            "password": "Demo@12345",
            "description": "Submit FDRs, manage renewals, upload documents, track scrutiny, and request releases for own college only."
        },
        {
            "role": "AICTE_OFFICER",
            "title": "AICTE Scrutiny & Verification Officer",
            "institution": "AICTE Headquarters / Regional Office",
            "email": "officer@demo.aicte.gov.in",
            "password": "Demo@12345",
            "description": "Scrutinize FDR documents, record verification decisions, flag discrepancies, process release requests."
        },
        {
            "role": "ADMIN",
            "title": "System Administrator",
            "institution": "AICTE ICT Cell",
            "email": "admin@demo.aicte.gov.in",
            "password": "Demo@12345",
            "description": "Manage users and permissions, monitor system audit logs, configure maturity reminders, inspect system health."
        }
    ]
