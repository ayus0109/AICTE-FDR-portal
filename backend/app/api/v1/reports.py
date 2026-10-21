import csv
import io
import datetime
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.models.models import FDRRecord, Institution, User
from app.security.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports and Analytics"])

@router.get("/export/fdrs.csv")
def export_fdrs_csv(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(FDRRecord).join(Institution, FDRRecord.institution_id == Institution.id)

    if current_user.role == "COLLEGE_USER":
        if not current_user.institution_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No institution linked")
        query = query.filter(FDRRecord.institution_id == current_user.institution_id)

    fdrs = query.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Record ID",
        "AICTE Code",
        "Institution Name",
        "FDR Number",
        "Bank Name",
        "Branch",
        "Amount (INR)",
        "Issue Date",
        "Maturity Date",
        "Deposit Type",
        "Administrative Status",
        "Maturity Status",
        "Verification Status",
        "Submission Date"
    ])

    today = datetime.datetime.utcnow().date()
    for f in fdrs:
        mat_date = f.maturity_date.date() if isinstance(f.maturity_date, datetime.datetime) else f.maturity_date
        days = (mat_date - today).days
        mat_status = "MATURED" if days < 0 else ("APPROACHING_MATURITY" if days <= 30 else "ACTIVE")

        # Sanitize text to prevent CSV Formula Injection (=, +, -, @)
        def sanitize_csv_cell(val):
            s = str(val or "")
            if s.startswith(("=", "+", "-", "@")):
                return "'" + s
            return s

        writer.writerow([
            f.id,
            sanitize_csv_cell(f.institution.aicte_code if f.institution else ""),
            sanitize_csv_cell(f.institution.name if f.institution else ""),
            sanitize_csv_cell(f.fdr_number),
            sanitize_csv_cell(f.bank_name),
            sanitize_csv_cell(f.branch_name),
            f.amount,
            f.issue_date.strftime("%Y-%m-%d") if f.issue_date else "",
            f.maturity_date.strftime("%Y-%m-%d") if f.maturity_date else "",
            sanitize_csv_cell(f.deposit_type),
            f.administrative_status,
            mat_status,
            f.verification_status,
            f.submission_date.strftime("%Y-%m-%d %H:%M:%S") if f.submission_date else ""
        ])

    csv_data = output.getvalue()
    filename = f"aicte_fdr_export_{datetime.datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/analytics")
def get_analytics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(FDRRecord)
    if current_user.role == "COLLEGE_USER":
        if not current_user.institution_id:
            return {"status_distribution": [], "bank_distribution": [], "maturity_timeline": []}
        query = query.filter(FDRRecord.institution_id == current_user.institution_id)

    fdrs = query.all()
    today = datetime.datetime.utcnow().date()

    status_counts = {}
    bank_amounts = {}
    maturity_buckets = {
        "Matured (Overdue)": 0,
        "0 - 7 Days": 0,
        "8 - 15 Days": 0,
        "16 - 30 Days": 0,
        "31 - 90 Days": 0,
        "> 90 Days": 0,
    }

    for f in fdrs:
        # Status counts
        status_counts[f.administrative_status] = status_counts.get(f.administrative_status, 0) + 1
        
        # Bank amounts
        bank_amounts[f.bank_name] = bank_amounts.get(f.bank_name, 0.0) + f.amount

        # Maturity timeline
        mat_date = f.maturity_date.date() if isinstance(f.maturity_date, datetime.datetime) else f.maturity_date
        days = (mat_date - today).days

        if days < 0:
            maturity_buckets["Matured (Overdue)"] += 1
        elif days <= 7:
            maturity_buckets["0 - 7 Days"] += 1
        elif days <= 15:
            maturity_buckets["8 - 15 Days"] += 1
        elif days <= 30:
            maturity_buckets["16 - 30 Days"] += 1
        elif days <= 90:
            maturity_buckets["31 - 90 Days"] += 1
        else:
            maturity_buckets["> 90 Days"] += 1

    return {
        "status_distribution": [{"name": k, "value": v} for k, v in status_counts.items()],
        "bank_distribution": [{"bank": k, "amount": v} for k, v in bank_amounts.items()],
        "maturity_timeline": [{"bucket": k, "count": v} for k, v in maturity_buckets.items()]
    }
