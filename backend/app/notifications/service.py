import datetime
from typing import Optional, List
import boto3
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.models import Notification, User

class NotificationService:
    @staticmethod
    def send_notification(
        db: Session,
        recipient_id: int,
        subject: str,
        message: str,
        notification_type: str = "SYSTEM",
        fdr_id: Optional[int] = None,
        due_date: Optional[datetime.datetime] = None,
        reminder_interval_key: Optional[str] = None
    ) -> Optional[Notification]:
        """
        Creates an in-app notification and optionally delivers via Amazon SNS.
        Uses reminder_interval_key to guarantee idempotency and avoid duplicate alerts.
        """
        # Idempotency check: if reminder_interval_key is provided and already exists, do not duplicate
        if reminder_interval_key:
            existing = db.query(Notification).filter(
                Notification.recipient_id == recipient_id,
                Notification.reminder_interval_key == reminder_interval_key
            ).first()
            if existing:
                return None

        delivery_provider = "IN_APP"
        delivery_status = "DELIVERED"

        # Check AWS SNS if configured
        if settings.USE_AWS_SNS and settings.SNS_TOPIC_ARN:
            try:
                sns_client = boto3.client("sns", region_name=settings.AWS_REGION)
                sns_client.publish(
                    TopicArn=settings.SNS_TOPIC_ARN,
                    Subject=f"[AICTE FDR Portal] {subject}"[:100],
                    Message=f"{subject}\n\n{message}\n\nAICTE Security Deposit Portal Notification"
                )
                delivery_provider = "AWS_SNS"
            except Exception as e:
                print(f"[AWS SNS Alert] Could not publish to SNS: {e}. Falling back to In-App delivery.")
                delivery_provider = "LOCAL_SIMULATION"
        elif settings.DEMO_MODE:
            delivery_provider = "LOCAL_SIMULATION"

        notification = Notification(
            recipient_id=recipient_id,
            fdr_id=fdr_id,
            notification_type=notification_type,
            subject=subject,
            message=message,
            due_date=due_date,
            is_read=False,
            delivery_provider=delivery_provider,
            delivery_status=delivery_status,
            reminder_interval_key=reminder_interval_key,
            created_at=datetime.datetime.utcnow()
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    @staticmethod
    def notify_officers(
        db: Session,
        subject: str,
        message: str,
        notification_type: str = "SYSTEM",
        fdr_id: Optional[int] = None,
        reminder_interval_key: Optional[str] = None
    ):
        officers = db.query(User).filter(User.role.in_(["AICTE_OFFICER", "ADMIN"]), User.is_active == True).all()
        for officer in officers:
            interval_key = f"OFFICER_{officer.id}_{reminder_interval_key}" if reminder_interval_key else None
            NotificationService.send_notification(
                db=db,
                recipient_id=officer.id,
                subject=subject,
                message=message,
                notification_type=notification_type,
                fdr_id=fdr_id,
                reminder_interval_key=interval_key
            )
