from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.models.models import AuditLog, User
from app.schemas.schemas import AuditLogResponse
from app.security.auth import require_roles

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    action: Optional[str] = None,
    current_user: User = Depends(require_roles(["ADMIN", "AICTE_OFFICER"])),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))

    logs = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()
    return logs
