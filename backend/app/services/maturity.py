import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.models import FDRRecord, User, Notification
from app.notifications.service import NotificationService
from app.services.audit import log_audit

def run_maturity_check(db: Session, actor: Any = None) -> Dict[str, Any]:
    """
    Automated Maturity Monitoring Engine.
    Configurable advance-notification intervals: 30 days, 15 days, 7 days, 0 days, and overdue.
    IDEMPOTENT: Prevents duplicate notifications for the same record and reminder interval.
    """
    today = datetime.datetime.utcnow().date()
    fdrs = db.query(FDRRecord).all()

    total_checked = len(fdrs)
    reminders_sent = 0
    matured_updated = 0
    generated_alerts: List[Dict[str, Any]] = []

    for fdr in fdrs:
        mat_date = fdr.maturity_date.date() if isinstance(fdr.maturity_date, datetime.datetime) else fdr.maturity_date
        days_remaining = (mat_date - today).days

        # Update maturity status
        if days_remaining < 0:
            if fdr.maturity_status != "MATURED":
                fdr.maturity_status = "MATURED"
                matured_updated += 1
        elif days_remaining <= 30:
            if fdr.maturity_status != "APPROACHING_MATURITY":
                fdr.maturity_status = "APPROACHING_MATURITY"

        # Check reminder triggers
        trigger_interval = None
        if days_remaining in [30, 15, 7, 0]:
            trigger_interval = days_remaining
        elif days_remaining < 0:
            trigger_interval = "OVERDUE"

        if trigger_interval is not None:
            # Construct unique idempotency key
            reminder_key = f"FDR_{fdr.id}_MATURITY_{trigger_interval}_{mat_date.strftime('%Y%m%d')}"

            # Prepare subject & message
            inst_name = fdr.institution.name if fdr.institution else f"Institution #{fdr.institution_id}"
            if trigger_interval == "OVERDUE":
                subject = f"URGENT: FDR {fdr.fdr_number} Matured - Renewal Overdue"
                message = f"FDR {fdr.fdr_number} for {inst_name} matured on {mat_date.strftime('%d-%b-%Y')} ({abs(days_remaining)} days ago). Urgent renewal or administrative release action required."
            elif trigger_interval == 0:
                subject = f"TODAY: FDR {fdr.fdr_number} Matures Today"
                message = f"FDR {fdr.fdr_number} of ₹{fdr.amount:,.2f} for {inst_name} matures today ({mat_date.strftime('%d-%b-%Y')}). Please initiate renewal submission."
            else:
                subject = f"NOTICE: FDR {fdr.fdr_number} Matures in {trigger_interval} Days"
                message = f"FDR {fdr.fdr_number} (₹{fdr.amount:,.2f} at {fdr.bank_name}) will mature on {mat_date.strftime('%d-%b-%Y')} ({trigger_interval} days remaining). Kindly submit renewal instrument."

            # Notify College Users of this institution
            inst_users = db.query(User).filter(User.institution_id == fdr.institution_id, User.is_active == True).all()
            for u in inst_users:
                notif = NotificationService.send_notification(
                    db=db,
                    recipient_id=u.id,
                    subject=subject,
                    message=message,
                    notification_type="MATURITY_ALERT",
                    fdr_id=fdr.id,
                    due_date=fdr.maturity_date,
                    reminder_interval_key=f"{reminder_key}_USER_{u.id}"
                )
                if notif:
                    reminders_sent += 1
                    generated_alerts.append({
                        "recipient": u.email,
                        "fdr_number": fdr.fdr_number,
                        "interval": trigger_interval,
                        "days_remaining": days_remaining
                    })

            # Notify AICTE Officers if 7 days or overdue
            if trigger_interval in [7, 0, "OVERDUE"]:
                NotificationService.notify_officers(
                    db=db,
                    subject=f"[AICTE Scrutiny Watch] {subject}",
                    message=f"Official Notice for AICTE: {message}",
                    notification_type="MATURITY_ALERT",
                    fdr_id=fdr.id,
                    reminder_interval_key=reminder_key
                )

    db.commit()

    log_audit(
        db,
        action="RUN_MATURITY_MONITORING_JOB",
        entity_type="ScheduledJob",
        entity_id=datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S"),
        actor=actor,
        metadata_json={
            "total_checked": total_checked,
            "reminders_sent": reminders_sent,
            "matured_updated": matured_updated,
        }
    )

    return {
        "status": "COMPLETED",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "total_checked": total_checked,
        "reminders_sent": reminders_sent,
        "matured_updated": matured_updated,
        "alerts_generated": generated_alerts
    }
