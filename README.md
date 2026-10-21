# AICTE Security Deposit / FDR Management Portal
### Problem Statement ID: 26265 — Streamline of Security Deposit / FDR Portal
**Intended Organization:** All India Council for Technical Education (AICTE), Ministry of Education, Government of India.

---

## 1. Executive Summary

Technical institutions applying for AICTE approval or introducing new courses are statutorily required to establish Fixed Deposit Receipts (FDRs) or Security Deposits in joint lien with the Member Secretary, AICTE. Managing these instruments across thousands of institutions via fragmented spreadsheets and physical files introduces risks of missed maturities, lack of verification traceability, and delays in legitimate release/refund requests.

The **AICTE FDR Management Portal** provides a centralized, secure, transparent, and auditable digital solution for the complete lifecycle of institutional security deposits:
1. **Digital Registration & Document Custody:** Institution users submit FDR instruments with branch seals, verified through server-side validation.
2. **AICTE Officer Scrutiny:** Structured verification workflow with discrepancy detection and mandatory observation logs.
3. **Automated Idempotent Maturity Monitoring:** EventBridge + Lambda scheduled engine calculating advance notices (30, 15, 7, 0 days, and overdue) with zero duplicate notifications.
4. **Renewal & Replacement Lineage:** Immutable historical audit preservation when maturing FDRs are renewed or replaced.
5. **Controlled Release / Refund Workflow:** Multi-step administrative authorization workflow for releasing security deposits post-tenure.
6. **AWS Cloud-Native with Local Fallback:** Deploys onto AWS in **Region `ap-southeast-2`** (Sydney) using S3, API Gateway, Lambda, SNS, Cognito, EventBridge, and RDS, while maintaining seamless 100% offline local development capability without AWS credentials.

---

## 2. Technology Stack

### Frontend
- **Framework:** React 18, TypeScript, Vite
- **Styling & UI:** Tailwind CSS (Government-grade deep navy `#0A2540` and saffron accents), Lucide React
- **Data Visualizations:** Recharts (Interactive Status Breakdown, Bank Exposure, Maturity Timeline)
- **Forms & Validation:** React Hook Form, Zod schema validation
- **Routing:** React Router v6 with role-based protected navigation

### Backend
- **Framework:** Python 3.11+, FastAPI (REST API under `/api/v1`)
- **Validation & Models:** Pydantic v2, SQLAlchemy ORM
- **Security & RBAC:** Native BCrypt password hashing, JWT Bearer tokens with institutional data isolation
- **Serverless Adapter:** Mangum for running FastAPI on AWS Lambda & API Gateway
- **AWS SDK:** Boto3 for Amazon S3 presigned URLs, Amazon SNS dispatches, and Cognito claims

### Database & Storage
- **Relational Tier:** PostgreSQL (production / RDS) with zero-setup SQLite fallback for local demo
- **Storage Tier:** Dual-mode: Amazon S3 (AES-256 encrypted private bucket) or Local non-public storage with path-traversal prevention

### Automated Testing
- **Framework:** Pytest, HTTPX, FastAPI TestClient (All 12 Scenarios A through L verified)

---

## 3. User Roles & Access Control (RBAC)

| Role | Scope | Permissions |
|---|---|---|
| **College User** | Strictly Own Institution | Submit FDRs, upload documents, view scrutiny remarks, submit renewals, request release, receive maturity alerts. Cannot access another college's data (enforced server-side). |
| **AICTE Officer** | All Institutions | Scrutinize FDR submissions, document inspection, record verification decisions (Verified, Clarification Required, Discrepancy Detected, Rejected), process renewals & release requests. |
| **System Administrator** | System-Wide | Manage authorized users, link college accounts, configure reminder policies, trigger scheduled monitoring jobs, inspect immutable audit logs. |

---

## 4. Quick Start (Local Development)

The application runs locally without any cloud dependencies.

### Prerequisites
- Node.js (v18+) & npm
- Python (v3.10+)

### Step-by-Step Launch (Windows PowerShell)

```powershell
# 1. Clone or open the repository folder
cd "c:\Users\ayush\Downloads\FDR portal"

# 2. Setup and run Backend
cd backend
python -m venv venv
.\venv\Scripts\pip.exe install -r requirements.txt
.\venv\Scripts\uvicorn.exe app.main:app --reload --host 127.0.0.1 --port 8000
# Backend is now live at: http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)

# 3. In a separate terminal, setup and run Frontend
cd "c:\Users\ayush\Downloads\FDR portal\frontend"
npm install
npm run dev
# Frontend is now live at: http://localhost:5173
```

Alternatively, run the automated launcher script:
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run_local.ps1
```

---

## 5. Hackathon Demo Accounts (1-Click Login)

The portal includes realistic synthetic demo data with 4 fictional technical institutions. Use the **1-Click Demo Persona Switcher** on the login page or enter credentials:

| Persona | Email | Password | Assigned Scope |
|---|---|---|---|
| **College User** | `college@demo.aicte.gov.in` | `Demo@12345` | Delhi Institute of Technology & Science |
| **AICTE Officer** | `officer@demo.aicte.gov.in` | `Demo@12345` | Scrutiny & Verification Bureau |
| **Administrator** | `admin@demo.aicte.gov.in` | `Demo@12345` | AICTE ICT System Governance |

---

## 6. End-to-End Hackathon Demonstration Sequence

1. **Sign In as College User:**
   - Click "College User" on the login screen.
   - Inspect the Institutional Dashboard: notice deposit KPI totals, upcoming maturities (15 days remaining), and status charts.
2. **Submit a New FDR Record:**
   - Navigate to **"Submit New FDR"**.
   - Enter FDR reference `SBI-2026-9901`, Bank `State Bank of India`, Amount `₹15,00,000`, Issue Date, Maturity Date.
   - Attach a scanned PDF or test receipt. Submit.
   - Observe automatic routing to the official scrutiny queue and confirmation notice.
3. **Switch to AICTE Scrutiny Officer:**
   - Use the top navigation bar's **"Demo Persona"** dropdown to switch to **"AICTE Officer"**.
   - Navigate to **"Scrutiny Queue"** or Dashboard to see the newly submitted FDR.
   - Click **"Scrutinize"**: inspect automated parameter checks, review document preview inline.
   - Record an official decision (e.g. `Mark Verified` or `Require Clarification`) with scrutiny remarks.
4. **Trigger Scheduled Maturity Monitor (Idempotent):**
   - Switch to **"Administrator"**.
   - On the Admin Dashboard, click **"Execute Scheduled Job Now"**.
   - Notice the system evaluates maturities, updates status, and dispatches notices.
   - Click it a second time: observe `reminders_sent: 0` (zero duplicate notifications created).
5. **FDR Renewal & Replacement Lineage:**
   - Switch back to **"College User"** and go to **"Renewals & Replace"**.
   - Select an expiring FDR, enter replacement instrument details, and submit.
   - Notice the original FDR remains accessible in history while the new replacement is linked.
6. **Security Deposit Release Request:**
   - Navigate to **"Release / Refunds"**.
   - Submit a release request on an eligible FDR with statutory grounds.
   - Switch to **"AICTE Officer"** to review and approve the administrative authorization.
7. **Institutional Isolation (Anti-IDOR Security):**
   - As a college user, try accessing an FDR belonging to another institution (`/fdrs/6`).
   - Server strictly responds with `403 Forbidden` and logs a security violation in the audit trail.
8. **Inspect Immutable Audit Trail:**
   - Navigate to **"Audit Trail"** to inspect every action timestamped with actor email and sanitized metadata.

---

## 7. Automated Test Suite (Scenarios A through L)

Run the test suite directly:

```powershell
cd backend
.\venv\Scripts\python.exe -m pytest -v
```

### Verified Test Results:
```text
tests/test_fdr_portal.py::test_scenario_a_new_fdr_submission PASSED      [  9%]
tests/test_fdr_portal.py::test_scenario_b_institution_isolation PASSED   [ 18%]
tests/test_fdr_portal.py::test_scenario_c_officer_scrutiny PASSED        [ 27%]
tests/test_fdr_portal.py::test_scenario_d_validation_rules PASSED        [ 36%]
tests/test_fdr_portal.py::test_scenario_e_and_f_maturity_monitoring_idempotency PASSED [ 45%]
tests/test_fdr_portal.py::test_scenario_g_renewal_workflow PASSED        [ 54%]
tests/test_fdr_portal.py::test_scenario_h_release_request PASSED         [ 63%]
tests/test_fdr_portal.py::test_scenario_i_role_authorization_enforcement PASSED [ 72%]
tests/test_fdr_portal.py::test_scenario_j_document_security_and_traversal PASSED [ 81%]
tests/test_fdr_portal.py::test_scenario_k_audit_history PASSED           [ 90%]
tests/test_fdr_portal.py::test_scenario_l_local_fallback PASSED          [100%]
====================== 11 passed in 20.04s ======================
```

---

## 8. AWS Cloud Architecture & Infrastructure as Code (IaC)

Complete Terraform scripts are available in `infrastructure/` targeting **Selected Region `ap-southeast-2`**:

- **Amazon S3:** Private bucket with SSE-AES256 and public access blocked (`infrastructure/main.tf`).
- **Amazon API Gateway:** HTTP API v2 routing requests to FastAPI via Mangum.
- **AWS Lambda:** Serverless execution for API and daily maturity worker.
- **Amazon EventBridge:** `rate(1 day)` rule scheduling automated maturity processing.
- **Amazon SNS:** Official topic broadcasting upcoming maturity alerts to verified email subscribers.
- **Amazon Cognito:** User Pool & Client managing authentication and RBAC claims.
- **Amazon RDS PostgreSQL:** Relational database tier with encrypted storage.
- **AWS CloudWatch:** 14-day retention log groups for observability.

---

## 9. Docker Deployment

To run the complete stack including PostgreSQL via Docker Compose:

```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

---

## 10. Cloud Deployment on Render (1-Click Blueprint)

The repository is configured for 1-click cloud deployment on [Render.com](https://render.com) using [`render.yaml`](./render.yaml).

For step-by-step instructions, see **[`DEPLOY_RENDER.md`](./DEPLOY_RENDER.md)**:
1. Push repository to GitHub/GitLab.
2. In Render Dashboard, click **New + -> Blueprint** and select the repository.
3. Render automatically provisions:
   - **`aicte-fdr-db`**: Render Managed PostgreSQL database (tables auto-migrated & seeded on startup).
   - **`aicte-fdr-backend`**: FastAPI Python Web Service.
   - **`aicte-fdr-frontend`**: React Vite Static Site with SPA rewrites.

---

## 11. Security & Compliance Safeguards

- **Backend-Enforced RBAC:** Frontend routes and buttons are protected, and every single API endpoint verifies identity and role claims server-side.
- **Cross-Institution Isolation:** Institutional scope verification prevents IDOR attacks.
- **Document Traversal Protection:** File storage keys are normalized and verified against directory boundaries before serving.
- **Audit Logging with Credential Redaction:** Passwords, tokens, and secret keys are automatically scrubbed from audit metadata.
- **No Direct Banking Claims:** The portal clearly records administrative approvals and distinguishes simulated verifications from live bank APIs.

---

## 12. Resetting Demonstration Data

To reset the database back to its pristine synthetic state at any point:
```powershell
cd backend
.\venv\Scripts\python.exe ..\scripts\reset_demo.py
```
Or click **"Reset Demo Records"** inside the **Settings** page in the web portal.
