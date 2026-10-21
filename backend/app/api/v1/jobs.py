from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User
from app.security.auth import require_roles
from app.services.maturity import run_maturity_check

router = APIRouter(prefix="/jobs", tags=["Scheduled Jobs"])

@router.post("/maturity-check")
def trigger_maturity_check(
    current_user: User = Depends(require_roles(["ADMIN", "AICTE_OFFICER"])),
    db: Session = Depends(get_db)
):
    """
    Manually triggers or simulates the EventBridge/Lambda scheduled daily maturity job.
    """
    result = run_maturity_check(db=db, actor=current_user)
    return result
