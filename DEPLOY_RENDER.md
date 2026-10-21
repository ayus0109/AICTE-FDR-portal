# Deploying AICTE FDR Management Portal to Render

This guide provides end-to-end instructions for deploying the **AICTE Security Deposit & Fixed Deposit Receipt (FDR) Management Portal** to [Render.com](https://render.com).

Render is a modern cloud platform that provides fully managed web services, static sites, and PostgreSQL databases with free-tier support, SSL certificates, continuous deployment from Git, and zero-downtime rollouts.

---

## Architecture on Render

```
                                      +-------------------------------+
                                      |         Render CDN            |
                                      |   aicte-fdr-frontend (SPA)    |
                                      |  (React 18 + Vite + Tailwind) |
                                      +---------------+---------------+
                                                      |
                                        REST API / JSON | HTTPS
                                                      v
                                      +-------------------------------+
                                      |      Render Web Service       |
                                      |   aicte-fdr-backend (FastAPI) |
                                      |      (Python 3.11 + Uvicorn)  |
                                      +---------------+---------------+
                                                      |
                                          SQLAlchemy  | PostgreSQL Wire
                                                      v
                                      +-------------------------------+
                                      |   Render Managed PostgreSQL   |
                                      |         aicte-fdr-db          |
                                      |     (Auto-migrated & Seeded)  |
                                      +-------------------------------+
```

The application consists of three connected components configured in [`render.yaml`](./render.yaml):
1. **`aicte-fdr-db`**: A managed PostgreSQL database for storing institutional records, FDR entries, scrutiny verifications, renewal lineage, release requests, and audit logs.
2. **`aicte-fdr-backend`**: A FastAPI Python web service running Uvicorn that handles REST API endpoints (`/api/v1`), JWT authentication, RBAC, scrutiny validation, and scheduled maturity sweeps.
3. **`aicte-fdr-frontend`**: A React single-page application (SPA) built with Vite and Tailwind CSS, hosted on Render Static Sites with SPA rewrite rules (`/* /index.html 200`).

---

## Prerequisites

1. A [GitHub](https://github.com) or [GitLab](https://gitlab.com) account.
2. A free [Render.com](https://render.com) account.
3. Git installed on your local computer.

---

## Step 1: Push Code to a Git Repository

Render deploys directly from your Git repository. If you haven't pushed this project to GitHub yet, run the following commands from the project root (`FDR portal`):

```powershell
# 1. Initialize git repository
git init

# 2. Stage all files (respecting .gitignore which excludes node_modules, venv, and cache)
git add .

# 3. Create initial commit
git commit -m "feat: AICTE Security Deposit & FDR Management Portal complete stack"

# 4. Rename default branch to main
git branch -M main

# 5. Create a new repository on GitHub (e.g., https://github.com/your-username/aicte-fdr-portal)
# Link your local repo to GitHub:
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/aicte-fdr-portal.git

# 6. Push code to GitHub
git push -u origin main
```

---

## Step 2: Deploy Using Method A (1-Click Blueprint — Recommended)

Render supports Infrastructure-as-Code via [`render.yaml`](./render.yaml) (Render Blueprint). This automatically provisions the database, backend, and frontend and connects them together with environment variables in a single click.

1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** in the top navigation bar and select **Blueprint**.
3. Connect your GitHub/GitLab account if prompted, and select the repository (`aicte-fdr-portal`).
4. Render will read [`render.yaml`](./render.yaml) and display the three services to create:
   - **`aicte-fdr-db`** (PostgreSQL Database)
   - **`aicte-fdr-backend`** (Python Web Service)
   - **`aicte-fdr-frontend`** (Static Site)
5. Click **Apply**.
6. Render will now provision all three resources:
   - The PostgreSQL database is spun up.
   - The backend builds Python dependencies and starts Uvicorn. On startup, the backend automatically creates all database tables and seeds demo institutions, accounts, and sample FDRs.
   - The frontend installs npm packages, runs Vite build, and deploys the static files to the global CDN.

---

## Step 2 Alternative: Method B (Manual Setup via Render Dashboard)

If you prefer to configure each component manually through the Render UI:

### 1. Create PostgreSQL Database
- Click **New +** -> **PostgreSQL**.
- **Name**: `aicte-fdr-db`
- **Database**: `aicte_fdr`
- **User**: `aicte_user`
- **Region**: Singapore (or nearest to your audience)
- **Plan**: Free
- Click **Create Database**.
- Once created, copy the **Internal Database URL** (e.g. `postgres://aicte_user:...@dpg-...-a/aicte_fdr`).

### 2. Create Backend Web Service
- Click **New +** -> **Web Service**.
- Select your repository (`aicte-fdr-portal`).
- **Name**: `aicte-fdr-backend`
- **Root Directory**: `backend`
- **Runtime**: `Python 3`
- **Region**: Same as database (e.g. Singapore)
- **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Plan**: Free
- **Environment Variables**:
  | Key | Value | Notes |
  |---|---|---|
  | `PYTHON_VERSION` | `3.11.9` | Ensures compatible Python runtime |
  | `SECRET_KEY` | *(Click "Generate" or enter random string)* | Used for JWT signing |
  | `DATABASE_URL` | *(Paste Internal Database URL from Step 1)* | Database connection |
  | `DEMO_MODE` | `true` | Enables 1-click persona demo logins |
  | `AWS_REGION` | `ap-southeast-2` | AWS Region constraint |
  | `CORS_ORIGINS` | `https://aicte-fdr-frontend.onrender.com` | Or your custom domain |
- Click **Create Web Service**. Wait for the build and deployment to complete. Copy your backend URL (e.g. `https://aicte-fdr-backend.onrender.com`).

### 3. Create Frontend Static Site
- Click **New +** -> **Static Site**.
- Select your repository (`aicte-fdr-portal`).
- **Name**: `aicte-fdr-frontend`
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `./dist`
- **Environment Variables**:
  | Key | Value | Notes |
  |---|---|---|
  | `VITE_API_URL` | `https://aicte-fdr-backend.onrender.com` | Backend URL from Step 2 |
- **Redirects / Rewrites**:
  - Render will automatically read [`frontend/public/_redirects`](./frontend/public/_redirects).
  - Or manually add: **Source**: `/*`, **Destination**: `/index.html`, **Action**: `Rewrite`.
- Click **Create Static Site**.

---

## Step 3: Verification & Health Checks

Once the deployment finishes:

1. **Backend Health Check**:
   Visit `https://<your-backend-name>.onrender.com/api/health`
   You should receive a JSON response:
   ```json
   {
     "status": "healthy",
     "service": "AICTE FDR Management Portal",
     "database": "connected",
     "demo_mode": true,
     "version": "1.0.0"
   }
   ```

2. **Interactive OpenAPI / Swagger Documentation**:
   Visit `https://<your-backend-name>.onrender.com/docs` to inspect and test all 12 API modules.

3. **Frontend Application**:
   Visit `https://<your-frontend-name>.onrender.com` to launch the portal.

---

## Pre-Loaded Demo Credentials

The backend automatically creates realistic sample data upon first startup. You can test each persona immediately using the 1-Click Persona Login buttons on the login page:

| Persona Role | Email | Password | Access Scope |
|---|---|---|---|
| **College User** | `college@demo.aicte.gov.in` | `Demo@12345` | Delhi Institute of Technology & Science (IDOR-protected institutional isolation) |
| **College User 2** | `college2@demo.aicte.gov.in` | `Demo@12345` | Bangalore College of Engineering & Research |
| **AICTE Scrutiny Officer** | `officer@demo.aicte.gov.in` | `Demo@12345` | Council Scrutiny Queue, Discrepancy Flagging, FDR Verification, Release Approvals |
| **System Administrator** | `admin@demo.aicte.gov.in` | `Demo@12345` | Full System Audit Logs, User Accounts, Institution Master, Scheduled Job Triggers |

---

## Important Render Details & Production Tips

### 1. Render Free Tier Spin-Down (Cold Start)
- On Render's Free tier, web services automatically sleep after 15 minutes of inactivity.
- When an API request arrives after spin-down, Render takes ~30–50 seconds to wake the container.
- For uninterrupted hackathon presentations, visit the backend URL `https://<your-backend>.onrender.com/api/health` 1 minute before your live demo to ensure the container is warm.

### 2. PostgreSQL URL Compatibility
- Render supplies connection strings prefixed with `postgres://`.
- SQLAlchemy 2.0+ requires `postgresql://`.
- **Note:** The backend code in `app/db/session.py` already includes an automatic normalizer that replaces `postgres://` with `postgresql://`, so no manual string manipulation is needed.

### 3. File Uploads on Render
- On the Free tier, local filesystem storage inside the container is ephemeral (erased on restarts).
- For local testing or hackathon demos, sample FDR PDFs are bundled and served via local storage simulation.
- For permanent production storage, set the following Render environment variables on `aicte-fdr-backend` to connect an S3 bucket in `ap-southeast-2`:
  - `USE_AWS_S3`: `true`
  - `AWS_S3_BUCKET_NAME`: `<your-aicte-fdr-bucket>`
  - `AWS_ACCESS_KEY_ID`: `<your-access-key>`
  - `AWS_SECRET_ACCESS_KEY`: `<your-secret-key>`
  - `AWS_REGION`: `ap-southeast-2`

### 4. SPA Page Refresh & Routing
- Render Static Sites require routing rules so refreshing pages like `/fdrs` or `/institutions` does not yield a 404.
- This is already pre-configured via [`frontend/public/_redirects`](./frontend/public/_redirects) (`/* /index.html 200`) and the rewrite rule in [`render.yaml`](./render.yaml).
