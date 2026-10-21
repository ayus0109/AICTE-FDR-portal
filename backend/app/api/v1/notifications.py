from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.models.models import Notification, User, FDRRecord
from app.schemas.schemas import NotificationResponse
from app.security.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifs = db.query(Notification).filter(
        Notification.recipient_id == current_user.id
    ).order_by(desc(Notification.created_at)).limit(50).all()

    results = []
    for n in notifs:
        fdr_num = None
        if n.fdr_id:
            fdr = db.query(FDRRecord).filter(FDRRecord.id == n.fdr_id).first()
            if fdr:
                fdr_num = fdr.fdr_number
        results.append(NotificationResponse(
            id=n.id,
            recipient_id=n.recipient_id,
            fdr_id=n.fdr_id,
            fdr_number=fdr_num,
            notification_type=n.notification_type,
            subject=n.subject,
            message=n.message,
            due_date=n.due_date,
            is_read=n.is_read,
            delivery_provider=n.delivery_provider,
            delivery_status=n.delivery_status,
            created_at=n.created_at
        ))
    return results

@router.put("/{id}/read")
def mark_read(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == id, Notification.recipient_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"status": "success", "id": id, "is_read": True}

@router.put("/read-all")
def mark_all_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(
        Notification.recipient_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"status": "success", "message": "All notifications marked as read"}
