# AICTE Security Deposit / FDR Portal — Infrastructure as Code (AWS)

This directory defines the automated cloud architecture for the **AICTE Security Deposit / FDR Portal** using HashiCorp Terraform.

## 1. Cloud Architecture Overview

| AWS Service | Role in Architecture | Security / Configuration Details |
|---|---|---|
| **Amazon S3** | Custodial storage of scanned FDRs & receipts | Private bucket, Public Access Blocked, AES-256 Server-Side Encryption, accessed strictly via short-lived presigned URLs. |
| **Amazon API Gateway** | Public API Entrypoint | HTTP API v2 with CORS protection, routing requests to backend Lambda. |
| **AWS Lambda** | Serverless compute runtime | Python 3.11 with Mangum ASGI adapter executing FastAPI requests and background maturity worker. |
| **Amazon EventBridge** | Automated Scheduler | Recurring rule `rate(1 day)` triggering daily maturity calculations. |
| **Amazon SNS** | Notification distribution | Topic broadcasting upcoming maturity and scrutiny alerts to configured college email subscriptions. |
| **Amazon Cognito** | Authentication & RBAC | User Pool managing institutional identities and custom claims (`role`, `institution_id`). |
| **Amazon RDS PostgreSQL** | Relational data tier | Multi-AZ ready PostgreSQL 16 instance with encrypted EBS storage (`gp3`). |
| **AWS CloudWatch** | Observability & Audit | Centralized log streams with 14-day retention for compliance. |

> **Target Selected Region:** `ap-southeast-2` (Sydney)

---

## 2. Prerequisites & Safety Notice

Per administrative guidelines:
- **Do not automatically deploy paid AWS resources without explicit approval.**
- The application includes a 100% functional local fallback mode that runs seamlessly without AWS credentials.

---

## 3. Terraform Deployment Steps

When authorized to deploy to your AWS project:

```bash
# 1. Navigate to infrastructure folder
cd infrastructure

# 2. Initialize Terraform providers
terraform init

# 3. Plan and review changes (dry-run)
terraform plan -var="aws_region=ap-southeast-2" -out=tfplan

# 4. Apply changes (only upon explicit authorization)
terraform apply tfplan
```

---

## 4. Estimated Cost Considerations

- **AWS Free Tier Eligible:**
  - S3: First 5 GB free for 12 months.
  - Lambda: 1,000,000 free requests per month.
  - API Gateway: 1,000,000 HTTP API calls free.
  - CloudWatch: 5 GB log ingestion free.
  - Cognito: 50,000 MAUs free tier.
- **Resources That Incur Costs Outside Free Tier:**
  - RDS `db.t4g.micro` PostgreSQL (~$15 - $18 / month if running continuously).
  - S3 document storage beyond free limits (~$0.025 / GB / month).

---

## 5. Teardown / Resource Cleanup Instructions

To avoid ongoing charges after demonstrating or testing the cloud infrastructure:

```bash
cd infrastructure
terraform destroy -var="aws_region=ap-southeast-2"
```
Ensure all files in the S3 bucket are deleted before destroying, or set `force_destroy = true`.
