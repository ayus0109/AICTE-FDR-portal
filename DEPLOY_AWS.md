# Deploying AICTE FDR Management Portal to AWS

Yes! The **AICTE Security Deposit / FDR Management Portal** was engineered from the start to be cloud-native on **Amazon Web Services (AWS)**.

The entire backend and architecture include direct integrations with AWS services via Boto3 and Mangum, targeting your selected Region: **`ap-southeast-2`** (Asia Pacific - Sydney).

---

## 🏛️ AWS Cloud Architecture

```
                                  +------------------------------------+
                                  |         AWS Amplify Hosting        |
                                  |    (or Amazon CloudFront + S3)     |
                                  |      React 18 + Vite Frontend      |
                                  +------------------+-----------------+
                                                     | HTTPS
                                                     v
                                  +------------------------------------+
                                  |       Amazon API Gateway HTTP      |
                                  |   (or AWS App Runner / Beanstalk)  |
                                  +------------------+-----------------+
                                                     |
                        +----------------------------+----------------------------+
                        |                                                         |
                        v                                                         v
        +-------------------------------+                         +-------------------------------+
        |    FastAPI on AWS Lambda      |                         | Amazon EventBridge (Daily)    |
        |      (via Mangum ASGI)        |                         |              +                |
        +---------------+---------------+                         |   Maturity Worker Lambda      |
                        |                                         +---------------+---------------+
                        |                                                         |
        +---------------+---------------+-----------------------+                 |
        |               |               |                       |                 |
        v               v               v                       v                 v
+---------------+ +-----------+ +---------------+     +------------------+ +---------------+
| Amazon S3     | | AWS KMS   | | Amazon Cognito|     | Amazon RDS       | | Amazon SNS    |
| (Private Docs)| | (AES-256) | | (User Pools)  |     | (PostgreSQL 16)  | | (Alerts Topic)|
+---------------+ +-----------+ +---------------+     +------------------+ +---------------+
```

---

## 🔒 Important AWS Project Guidelines

When managing AWS resources for your project:
- **Selected Region:** Always use **`ap-southeast-2`** (Asia Pacific - Sydney) for regional resources (S3, RDS, SNS, Lambda, Beanstalk/App Runner).
- **Billing & Cost Notice:** 
  - AWS Free Tier covers Lambda (1M requests/mo), S3 (5GB), API Gateway (1M calls), SNS (1M publishes), and Cognito (50,000 MAUs).
  - Amazon RDS `db.t4g.micro` incurs a cost of ~$15–$18/month if running outside the 12-month AWS Free Tier.
  - Never leave billable cloud resources running unattended after a hackathon presentation.
- **Terminology:**
  - Refer to your AWS account as your **project**.
  - Refer to collaborators as **team members**.
  - Access project management, billing, and spend limits in **AWS Settings** at `settings.aws.com`.
- **Local Fallback:** The application operates 100% offline with SQLite and local storage without needing AWS credentials.

---

## Deployment Option 1: AWS Amplify (Frontend) + AWS App Runner (Backend) (Fastest & Simplest)

This approach deploys the frontend directly to AWS Amplify Hosting and the containerized backend to AWS App Runner or Elastic Beanstalk.

### 1. Deploy the Frontend on AWS Amplify
1. Push your repository to GitHub.
2. Sign in to the AWS Management Console in selected Region **`ap-southeast-2`**.
3. Open **AWS Amplify Hosting** -> Click **Create new app** -> **GitHub**.
4. Select your repository `aicte-fdr-portal` and branch `main`.
5. Select the `frontend` folder or let Amplify use the included [`frontend/amplify.yml`](./frontend/amplify.yml).
6. Set the environment variable:
   - `VITE_API_BASE_URL`: URL of your backend API (e.g. `https://xxxxxx.ap-southeast-2.awsapprunner.com/api/v1`)
7. Under **Rewrites and redirects**, add a Single Page App (SPA) rewrite rule:
   - **Source address:** `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>`
   - **Target address:** `/index.html`
   - **Type:** `200 (Rewrite)`
8. Click **Save and deploy**.

### 2. Deploy the Backend on AWS App Runner
1. In the AWS Console, search for **AWS App Runner** in **`ap-southeast-2`**.
2. Click **Create an App Runner service**.
3. Choose **Source code repository** -> connect GitHub -> select `backend` directory (Python 3 runtime).
4. **Build command:** `pip install --upgrade pip && pip install -r requirements.txt`
5. **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port 8080`
6. **Port:** `8080`
7. Add Environment Variables:
   - `DEMO_MODE`: `true`
   - `AWS_REGION`: `ap-southeast-2`
   - `DATABASE_URL`: Your Amazon RDS PostgreSQL connection URL (or leave blank for SQLite local mode during prototype evaluation)
   - `SECRET_KEY`: `<random-secure-string>`
8. Click **Deploy**.

---

## Deployment Option 2: Full Serverless via Terraform (IaC)

A complete, production-grade Infrastructure-as-Code suite is included in [`infrastructure/`](./infrastructure/).

### Resources Provisioned by Terraform:
- **Amazon S3**: Private encrypted bucket for scanned FDR receipts with blocked public access.
- **Amazon API Gateway HTTP API v2**: With CORS configured.
- **AWS Lambda**:
  - `aicte-fdr-api`: FastAPI backend powered by Mangum ASGI adapter (`backend/app/aws/api_lambda.py`).
  - `aicte-fdr-maturity-worker`: Automated maturity sweeper (`backend/app/aws/maturity_lambda.py`).
- **Amazon EventBridge**: Daily scheduled trigger `rate(1 day)`.
- **Amazon SNS**: Broadcast topic for upcoming maturity notices.
- **Amazon Cognito**: User Pool with custom role claims (`COLLEGE_USER`, `AICTE_OFFICER`, `ADMIN`).
- **Amazon RDS**: Managed PostgreSQL 16 on `db.t4g.micro`.

### Terraform Deployment Commands:

```bash
# 1. Open PowerShell or Terminal
cd infrastructure

# 2. Initialize Terraform AWS Provider
terraform init

# 3. Dry-run and review resources (Safe, does not create anything)
terraform plan -var="aws_region=ap-southeast-2" -out=tfplan

# 4. Apply (Run ONLY when you explicitly authorize cloud resource creation)
terraform apply tfplan
```

### Clean Up (Teardown):

```bash
cd infrastructure
terraform destroy -var="aws_region=ap-southeast-2"
```

---

## 🔗 Hybrid AWS Integration (Connecting Local/Render to Real AWS Services)

You don't need to deploy the entire server to AWS to use AWS services. You can run the application on Render or locally while connecting to real AWS cloud services:

1. **Amazon S3 Document Storage:**
   Set `USE_AWS_S3=true` and `AWS_S3_BUCKET_NAME=<your-bucket-in-ap-southeast-2>` in your `.env`. All uploaded FDR receipts will automatically stream to AWS S3 with AES-256 encryption.
2. **Amazon SNS Alerts:**
   Set `USE_AWS_SNS=true` and `SNS_TOPIC_ARN=<your-arn-in-ap-southeast-2>`. Real SMS/email alerts will be delivered when an FDR reaches 30, 15, or 7 days to maturity.
3. **Amazon Cognito Auth:**
   Set `USE_AWS_COGNITO=true` and provide User Pool credentials to delegate user identity management to AWS.

All AWS services strictly use your selected Region: **`ap-southeast-2`**.
