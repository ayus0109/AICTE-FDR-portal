import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field

# User & Auth Schemas
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    email: str
    institution_id: Optional[int] = None
    institution_name: Optional[str] = None

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    institution_id: Optional[int] = None

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str
    institution_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime.datetime
    institution_name: Optional[str] = None

    class Config:
        from_attributes = True

# Institution Schemas
class InstitutionBase(BaseModel):
    name: str
    aicte_code: str
    institution_type: str = "Technical Institute"
    address: str
    state: str
    contact_person: str
    email: EmailStr
    phone: str

class InstitutionCreate(InstitutionBase):
    pass

class InstitutionResponse(InstitutionBase):
    id: int
    status: str
    created_at: datetime.datetime
    fdr_count: Optional[int] = 0
    total_fdr_amount: Optional[float] = 0.0

    class Config:
        from_attributes = True

# Document Schemas
class DocumentResponse(BaseModel):
    id: int
    fdr_id: int
    storage_provider: str
    storage_key: Optional[str] = None
    original_filename: str
    file_type: str
    file_size: int
    created_at: datetime.datetime
    download_url: Optional[str] = None

    class Config:
        from_attributes = True

# Verification Schemas
class VerificationCreate(BaseModel):
    outcome: str = Field(..., description="VERIFIED, CLARIFICATION_REQUIRED, DISCREPANCY_DETECTED, or REJECTED")
    observations: str = Field(..., min_length=5, description="Scrutiny notes and mandatory reason")
    verification_method: str = "MANUAL_SCRUTINY"  # MANUAL_SCRUTINY or DEMO_BANK_SIMULATION
    supporting_reference: Optional[str] = None

class VerificationResponse(BaseModel):
    id: int
    fdr_id: int
    reviewer_id: Optional[int]
    reviewer_name: Optional[str] = None
    verification_method: str
    outcome: str
    observations: str
    supporting_reference: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# FDR Schemas
class FDRBase(BaseModel):
    fdr_number: str
    bank_name: str
    branch_name: str
    amount: float = Field(..., gt=0, description="Amount in INR, must be positive")
    currency: str = "INR"
    issue_date: datetime.date
    maturity_date: datetime.date
    deposit_type: str = "Security Deposit"
    institution_id: Optional[int] = None

class FDRCreate(FDRBase):
    original_fdr_id: Optional[int] = None

class FDRResponse(BaseModel):
    id: int
    institution_id: int
    institution_name: Optional[str] = None
    aicte_code: Optional[str] = None
    fdr_number: str
    bank_name: str
    branch_name: str
    amount: float
    currency: str
    issue_date: datetime.datetime
    maturity_date: datetime.datetime
    deposit_type: str
    administrative_status: str
    maturity_status: str
    verification_status: str
    scrutiny_remarks: Optional[str] = None
    original_fdr_id: Optional[int] = None
    days_to_maturity: Optional[int] = None
    documents: List[DocumentResponse] = []
    verifications: List[VerificationResponse] = []
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

# Renewal Schemas
class RenewalCreate(BaseModel):
    original_fdr_id: int
    fdr_number: str
    bank_name: str
    branch_name: str
    amount: float = Field(..., gt=0)
    issue_date: datetime.date
    maturity_date: datetime.date
    deposit_type: str = "Security Deposit"
    remarks: Optional[str] = None

class RenewalResponse(BaseModel):
    id: int
    original_fdr_id: int
    original_fdr_number: Optional[str] = None
    replacement_fdr_id: int
    replacement_fdr_number: Optional[str] = None
    submission_date: datetime.datetime
    status: str
    remarks: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Release Request Schemas
class ReleaseRequestCreate(BaseModel):
    fdr_id: int
    reason: str = Field(..., min_length=10)

class ReleaseRequestUpdate(BaseModel):
    status: str = Field(..., description="UNDER_REVIEW, CLARIFICATION_REQUIRED, APPROVED, REJECTED, COMPLETED")
    remarks: str = Field(..., min_length=5)

class ReleaseRequestResponse(BaseModel):
    id: int
    fdr_id: int
    fdr_number: Optional[str] = None
    institution_id: int
    institution_name: Optional[str] = None
    amount: Optional[float] = None
    requester_id: Optional[int]
    requester_name: Optional[str] = None
    reason: str
    status: str
    reviewer_id: Optional[int]
    reviewer_name: Optional[str] = None
    remarks: Optional[str]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

# Notification Schemas
class NotificationResponse(BaseModel):
    id: int
    recipient_id: int
    fdr_id: Optional[int]
    fdr_number: Optional[str] = None
    notification_type: str
    subject: str
    message: str
    due_date: Optional[datetime.datetime]
    is_read: bool
    delivery_provider: str
    delivery_status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Audit Log Schemas
class AuditLogResponse(BaseModel):
    id: int
    actor_id: Optional[int]
    actor_email: Optional[str]
    action: str
    entity_type: str
    entity_id: Optional[str]
    result: str
    metadata_json: Optional[Any]
    ip_address: Optional[str]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Dashboard Stats Schemas
class CollegeDashboardStats(BaseModel):
    total_fdrs: int
    active_fdrs: int
    approaching_maturity: int
    matured: int
    under_verification: int
    clarification_required: int
    renewals_in_progress: int
    pending_release_requests: int
    total_deposit_amount: float

class OfficerDashboardStats(BaseModel):
    total_institutions: int
    total_fdrs: int
    pending_scrutiny: int
    upcoming_maturities: int
    matured_unresolved: int
    discrepancy_cases: int
    renewals_awaiting_review: int
    pending_release_requests: int
    total_portfolio_amount: float

class AdminDashboardStats(BaseModel):
    total_institutions: int
    total_users: int
    total_fdrs: int
    total_amount: float
    system_health: str
    last_maturity_job: Optional[dict] = None
    recent_audit_count: int
    status_distribution: dict
    bank_distribution: dict
