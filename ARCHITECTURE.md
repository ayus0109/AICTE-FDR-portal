# AICTE Security Deposit / FDR Management Portal
## Project Implementation & Architectural Blueprint

### System Overview
This project digitizes and streamlines the lifecycle management of security deposits and Fixed Deposit Receipts (FDRs) submitted by technical institutions to the **All India Council for Technical Education (AICTE)**.

### Target Architecture
1. **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts, React Router v6, React Hook Form + Zod.
2. **Backend:** FastAPI (Python 3), SQLAlchemy ORM (PostgreSQL & SQLite zero-setup fallback), Pydantic v2, Alembic, Mangum (AWS Lambda adapter), Boto3.
3. **AWS Integration Layer:**
   - Private S3 document storage with presigned URLs & server-side authorization.
   - Amazon API Gateway + AWS Lambda execution adapter via Mangum.
   - Amazon Cognito token verification adapter.
   - Amazon EventBridge + Lambda for scheduled daily maturity checks (idempotent notification logic).
   - Amazon SNS notification provider with in-app notification center.
   - Amazon RDS PostgreSQL compatibility with Alembic migrations.
   - AWS IAM least-privilege policies & AWS KMS encryption configuration.
4. **Local Fallback:**
   - Full functionality runs 100% locally with zero cloud dependencies required.
   - Local document storage engine with path traversal protections.
   - JWT demo authentication with institution-level isolation.
   - In-app notification center and deterministic simulated maturity checks.

### Role-Based Access Control (RBAC) Matrix
- **College User:** Can view only their institution's FDRs, register new FDRs, upload documents, track scrutiny, submit renewals, and submit release/refund requests. Cannot access another institution's records (enforced server-side).
- **AICTE Officer:** Scrutinizes FDR submissions, reviews documents, marks verification status (Verified, Clarification Required, Discrepancy Detected, Rejected), records scrutiny remarks, processes renewal/release requests.
- **System Administrator:** Manages users, links college users to institutions, configures reminder intervals, views audit logs and aggregate system health.
