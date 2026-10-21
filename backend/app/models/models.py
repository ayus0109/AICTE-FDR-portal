import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text, JSON
)
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # COLLEGE_USER, AICTE_OFFICER, ADMIN
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    institution = relationship("Institution", back_populates="users")
    notifications = relationship("Notification", back_populates="recipient")


class Institution(Base):
    __tablename__ = "institutions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    aicte_code = Column(String(100), unique=True, index=True, nullable=False)
    institution_type = Column(String(100), default="Technical Institute")  # Engineering, Management, Pharmacy, Polytechnic
    address = Column(String(500), nullable=False)
    state = Column(String(100), nullable=False)
    contact_person = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, PENDING_VERIFICATION, SUSPENDED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="institution")
    fdrs = relationship("FDRRecord", back_populates="institution")
    release_requests = relationship("ReleaseRequest", back_populates="institution")


class FDRRecord(Base):
    __tablename__ = "fdr_records"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    fdr_number = Column(String(100), index=True, nullable=False)
    bank_name = Column(String(255), nullable=False)
    branch_name = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    issue_date = Column(DateTime, nullable=False)
    maturity_date = Column(DateTime, nullable=False, index=True)
    deposit_type = Column(String(100), default="Security Deposit")  # Security Deposit, AICTE Approval, New Course, Corpus Fund
    
    # Administrative Workflow Status
    # DRAFT, SUBMITTED, UNDER_REVIEW, VERIFIED, CLARIFICATION_REQUIRED, DISCREPANCY_DETECTED, REJECTED
    administrative_status = Column(String(50), default="SUBMITTED", index=True)
    
    # Date-derived Maturity Status
    # ACTIVE, APPROACHING_MATURITY, MATURED
    maturity_status = Column(String(50), default="ACTIVE", index=True)
    
    # Verification Status: PENDING, VERIFIED, REJECTED, CLARIFICATION_NEEDED
    verification_status = Column(String(50), default="PENDING")
    scrutiny_remarks = Column(Text, nullable=True)
    
    # Renewal hierarchy: if this is a renewal/replacement of an older FDR
    original_fdr_id = Column(Integer, ForeignKey("fdr_records.id", ondelete="SET NULL"), nullable=True)
    
    submission_date = Column(DateTime, default=datetime.datetime.utcnow)
    submitted_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    institution = relationship("Institution", back_populates="fdrs")
    documents = relationship("Document", back_populates="fdr", cascade="all, delete-orphan")
    verifications = relationship("VerificationRecord", back_populates="fdr", cascade="all, delete-orphan")
    release_requests = relationship("ReleaseRequest", back_populates="fdr")
    renewals_as_original = relationship("RenewalRecord", foreign_keys="RenewalRecord.original_fdr_id", back_populates="original_fdr")
    renewals_as_replacement = relationship("RenewalRecord", foreign_keys="RenewalRecord.replacement_fdr_id", back_populates="replacement_fdr")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    fdr_id = Column(Integer, ForeignKey("fdr_records.id", ondelete="CASCADE"), nullable=False, index=True)
    storage_provider = Column(String(50), default="LOCAL")  # LOCAL or S3
    storage_key = Column(String(500), nullable=False)
    original_filename = Column(String(255), nullable=False)
    safe_filename = Column(String(255), nullable=False)
    file_type = Column(String(100), nullable=False)  # application/pdf, image/png, etc.
    file_size = Column(Integer, nullable=False)  # bytes
    upload_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    fdr = relationship("FDRRecord", back_populates="documents")


class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id = Column(Integer, primary_key=True, index=True)
    fdr_id = Column(Integer, ForeignKey("fdr_records.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verification_method = Column(String(100), default="MANUAL_SCRUTINY")  # MANUAL_SCRUTINY, DEMO_BANK_SIMULATION
    outcome = Column(String(50), nullable=False)  # VERIFIED, CLARIFICATION_REQUIRED, DISCREPANCY_DETECTED, REJECTED
    observations = Column(Text, nullable=False)
    supporting_reference = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    fdr = relationship("FDRRecord", back_populates="verifications")
    reviewer = relationship("User")


class RenewalRecord(Base):
    __tablename__ = "renewal_records"

    id = Column(Integer, primary_key=True, index=True)
    original_fdr_id = Column(Integer, ForeignKey("fdr_records.id", ondelete="CASCADE"), nullable=False)
    replacement_fdr_id = Column(Integer, ForeignKey("fdr_records.id", ondelete="CASCADE"), nullable=False)
    submission_date = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(50), default="PENDING_REVIEW")  # PENDING_REVIEW, APPROVED, REJECTED
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    original_fdr = relationship("FDRRecord", foreign_keys=[original_fdr_id], back_populates="renewals_as_original")
    replacement_fdr = relationship("FDRRecord", foreign_keys=[replacement_fdr_id], back_populates="renewals_as_replacement")


class ReleaseRequest(Base):
    __tablename__ = "release_requests"

    id = Column(Integer, primary_key=True, index=True)
    fdr_id = Column(Integer, ForeignKey("fdr_records.id", ondelete="CASCADE"), nullable=False, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    requester_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reason = Column(Text, nullable=False)
    status = Column(String(50), default="SUBMITTED")  # DRAFT, SUBMITTED, UNDER_REVIEW, CLARIFICATION_REQUIRED, APPROVED, REJECTED, COMPLETED
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    fdr = relationship("FDRRecord", back_populates="release_requests")
    institution = relationship("Institution", back_populates="release_requests")
    requester = relationship("User", foreign_keys=[requester_id])
    reviewer = relationship("User", foreign_keys=[reviewer_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    fdr_id = Column(Integer, ForeignKey("fdr_records.id", ondelete="SET NULL"), nullable=True)
    notification_type = Column(String(50), nullable=False)  # MATURITY_ALERT, SCRUTINY_UPDATE, RENEWAL_ALERT, RELEASE_UPDATE, SYSTEM
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    due_date = Column(DateTime, nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    delivery_provider = Column(String(50), default="IN_APP")  # IN_APP, SNS_EMAIL, SNS_SMS, LOCAL_SIMULATION
    delivery_status = Column(String(50), default="DELIVERED")  # DELIVERED, PENDING, FAILED
    reminder_interval_key = Column(String(100), nullable=True)  # e.g., "FDR_10_INTERVAL_15" for deduplication!
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    # Relationships
    recipient = relationship("User", back_populates="notifications")
    fdr = relationship("FDRRecord")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, nullable=True)
    actor_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False, index=True)  # LOGIN, CREATE_FDR, VERIFY_FDR, SUBMIT_RENEWAL, REQUEST_RELEASE, etc.
    entity_type = Column(String(100), nullable=False)  # FDRRecord, Document, ReleaseRequest, User
    entity_id = Column(String(100), nullable=True)
    result = Column(String(50), default="SUCCESS")  # SUCCESS, FAILURE, DENIED
    metadata_json = Column(JSON, nullable=True)
    ip_address = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)


class SystemConfig(Base):
    __tablename__ = "system_configs"

    key = Column(String(100), primary_key=True)
    value_json = Column(JSON, nullable=False)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
