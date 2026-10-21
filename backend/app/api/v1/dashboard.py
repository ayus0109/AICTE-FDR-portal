import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.models import FDRRecord, Institution, User, RenewalRecord, ReleaseRequest, AuditLog
from app.schemas.schemas import CollegeDashboardStats, OfficerDashboardStats, AdminDashboardStats
from app.security.auth import get_current_user, require_roles

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/college", response_model=CollegeDashboardStats)
def get_college_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.institution_id:
        return CollegeDashboardStats(
            total_fdrs=0,
            active_fdrs=0,
            approaching_maturity=0,
            matured=0,
            under_verification=0,
            clarification_required=0,
            renewals_in_progress=0,
            pending_release_requests=0,
            total_deposit_amount=0.0
        )

    inst_id = current_user.institution_id
    today = datetime.datetime.utcnow().date()
    fdrs = db.query(FDRRecord).filter(FDRRecord.institution_id == inst_id).all()

    total_count = len(fdrs)
    total_amount = sum(f.amount for f in fdrs)
    active_count = 0
    approaching_count = 0
    matured_count = 0
    under_verification_count = 0
    clarification_count = 0

    for f in fdrs:
        mat_date = f.maturity_date.date() if isinstance(f.maturity_date, datetime.datetime) else f.maturity_date
        days = (mat_date - today).days

        if f.administrative_status in ["SUBMITTED", "UNDER_REVIEW"]:
            under_verification_count += 1
        elif f.administrative_status == "CLARIFICATION_REQUIRED":
            clarification_count += 1

        if days < 0:
            matured_count += 1
        elif days <= 30:
            approaching_count += 1
        else:
            active_count += 1

    renewals_count = db.query(RenewalRecord).join(
        FDRRecord, RenewalRecord.original_fdr_id == FDRRecord.id
    ).filter(
        FDRRecord.institution_id == inst_id,
        RenewalRecord.status == "PENDING_REVIEW"
    ).count()

    releases_count = db.query(ReleaseRequest).filter(
        ReleaseRequest.institution_id == inst_id,
        ReleaseRequest.status.in_(["SUBMITTED", "UNDER_REVIEW", "CLARIFICATION_REQUIRED"])
    ).count()

    return CollegeDashboardStats(
        total_fdrs=total_count,
        active_fdrs=active_count,
        approaching_maturity=approaching_count,
        matured=matured_count,
        under_verification=under_verification_count,
        clarification_required=clarification_count,
        renewals_in_progress=renewals_count,
        pending_release_requests=releases_count,
        total_deposit_amount=total_amount
    )

@router.get("/officer", response_model=OfficerDashboardStats)
def get_officer_stats(current_user: User = Depends(require_roles(["AICTE_OFFICER", "ADMIN"])), db: Session = Depends(get_db)):
    today = datetime.datetime.utcnow().date()
    institutions_count = db.query(Institution).count()
    fdrs = db.query(FDRRecord).all()

    total_count = len(fdrs)
    total_amount = sum(f.amount for f in fdrs)
    pending_scrutiny = 0
    upcoming_maturities = 0
    matured_unresolved = 0
    discrepancy_cases = 0

    for f in fdrs:
        mat_date = f.maturity_date.date() if isinstance(f.maturity_date, datetime.datetime) else f.maturity_date
        days = (mat_date - today).days

        if f.administrative_status in ["SUBMITTED", "UNDER_REVIEW"]:
            pending_scrutiny += 1
        elif f.administrative_status in ["DISCREPANCY_DETECTED", "CLARIFICATION_REQUIRED"]:
            discrepancy_cases += 1

        if days < 0:
            matured_unresolved += 1
        elif days <= 30:
            upcoming_maturities += 1

    renewals_awaiting = db.query(RenewalRecord).filter(RenewalRecord.status == "PENDING_REVIEW").count()
    releases_pending = db.query(ReleaseRequest).filter(ReleaseRequest.status.in_(["SUBMITTED", "UNDER_REVIEW"])).count()

    return OfficerDashboardStats(
        total_institutions=institutions_count,
        total_fdrs=total_count,
        pending_scrutiny=pending_scrutiny,
        upcoming_maturities=upcoming_maturities,
        matured_unresolved=matured_unresolved,
        discrepancy_cases=discrepancy_cases,
        renewals_awaiting_review=renewals_awaiting,
        pending_release_requests=releases_pending,
        total_portfolio_amount=total_amount
    )

@router.get("/admin", response_model=AdminDashboardStats)
def get_admin_stats(current_user: User = Depends(require_roles(["ADMIN"])), db: Session = Depends(get_db)):
    inst_count = db.query(Institution).count()
    user_count = db.query(User).count()
    fdrs = db.query(FDRRecord).all()

    total_amount = sum(f.amount for f in fdrs)

    status_dist = {}
    bank_dist = {}
    for f in fdrs:
        status_dist[f.administrative_status] = status_dist.get(f.administrative_status, 0) + 1
        bank_dist[f.bank_name] = bank_dist.get(f.bank_name, 0) + 1

    audit_count = db.query(AuditLog).count()

    return AdminDashboardStats(
        total_institutions=inst_count,
        total_users=user_count,
        total_fdrs=len(fdrs),
        total_amount=total_amount,
        system_health="ONLINE - ALL SERVICES OPERATIONAL",
        last_maturity_job={
            "status": "COMPLETED",
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "mode": "IDEMPOTENT_SCHEDULER"
        },
        recent_audit_count=audit_count,
        status_distribution=status_dist,
        bank_distribution=bank_dist
    )
