import datetime
from typing import Optional, Any
from sqlalchemy.orm import Session
from app.models.models import AuditLog, User

def log_audit(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    actor: Optional[User] = None,
    result: str = "SUCCESS",
    metadata_json: Optional[Any] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    """
    Logs an audit record. Excludes sensitive data (passwords, tokens, keys) by contract.
    """
    safe_metadata = None
    if isinstance(metadata_json, dict):
        # Redact any passwords or tokens if accidentally passed
        safe_metadata = {
            k: ("[REDACTED]" if any(s in k.lower() for s in ["password", "secret", "token", "key"]) else v)
            for k, v in metadata_json.items()
        }
    elif metadata_json is not None:
        safe_metadata = metadata_json

    audit_entry = AuditLog(
        actor_id=actor.id if actor else None,
        actor_email=actor.email if actor else "SYSTEM",
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id else None,
        result=result,
        metadata_json=safe_metadata,
        ip_address=ip_address,
        created_at=datetime.datetime.utcnow()
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    return audit_entry
