import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.session import SessionLocal
from app.db.init_db import init_db

# Routers
from app.api.v1.auth import router as auth_router
from app.api.v1.institutions import router as institutions_router
from app.api.v1.fdrs import router as fdrs_router
from app.api.v1.documents import router as documents_router
from app.api.v1.renewals import router as renewals_router
from app.api.v1.releases import router as releases_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.reports import router as reports_router
from app.api.v1.users import router as users_router
from app.api.v1.audit import router as audit_router
from app.api.v1.jobs import router as jobs_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB and seeds if empty
    db = SessionLocal()
    try:
        init_db(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Centralized, secure and transparent platform for institutional security deposits & Fixed Deposit Receipts (FDRs). Designed for AICTE, Ministry of Education, Government of India.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers under /api/v1
api_v1_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1_prefix)
app.include_router(institutions_router, prefix=api_v1_prefix)
app.include_router(fdrs_router, prefix=api_v1_prefix)
app.include_router(documents_router, prefix=api_v1_prefix)
app.include_router(renewals_router, prefix=api_v1_prefix)
app.include_router(releases_router, prefix=api_v1_prefix)
app.include_router(notifications_router, prefix=api_v1_prefix)
app.include_router(dashboard_router, prefix=api_v1_prefix)
app.include_router(reports_router, prefix=api_v1_prefix)
app.include_router(users_router, prefix=api_v1_prefix)
app.include_router(audit_router, prefix=api_v1_prefix)
app.include_router(jobs_router, prefix=api_v1_prefix)

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "database": "connected",
        "storage_provider": "AWS_S3" if settings.USE_AWS_S3 else "LOCAL_STORAGE",
        "notification_provider": "AWS_SNS" if settings.USE_AWS_SNS else "LOCAL_SIMULATION",
        "aws_region": settings.AWS_REGION,
        "demo_mode": settings.DEMO_MODE,
        "version": "1.0.0"
    }
