import os
from typing import List, Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AICTE Security Deposit / FDR Portal"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "aicte_fdr_super_secret_jwt_key_hackathon_2026_demo_only")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./aicte_fdr.db")
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ] + [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
    
    # Storage Configuration
    STORAGE_DIR: str = os.getenv("STORAGE_DIR", os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads"))
    MAX_UPLOAD_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB limit
    ALLOWED_EXTENSIONS: List[str] = ["pdf", "jpg", "jpeg", "png"]
    
    # AWS Services Configuration (Selected Region: ap-southeast-2)
    AWS_REGION: str = os.getenv("AWS_REGION", "ap-southeast-2")
    USE_AWS_S3: bool = os.getenv("USE_AWS_S3", "false").lower() == "true"
    S3_BUCKET_NAME: Optional[str] = os.getenv("S3_BUCKET_NAME", "aicte-fdr-documents-ap-southeast-2")
    
    USE_AWS_COGNITO: bool = os.getenv("USE_AWS_COGNITO", "false").lower() == "true"
    COGNITO_USER_POOL_ID: Optional[str] = os.getenv("COGNITO_USER_POOL_ID", None)
    COGNITO_CLIENT_ID: Optional[str] = os.getenv("COGNITO_CLIENT_ID", None)
    
    USE_AWS_SNS: bool = os.getenv("USE_AWS_SNS", "false").lower() == "true"
    SNS_TOPIC_ARN: Optional[str] = os.getenv("SNS_TOPIC_ARN", None)
    
    # Hackathon Demo Mode
    DEMO_MODE: bool = True
    
    # Maturity Check Settings
    REMINDER_DAYS_BEFORE: List[int] = [30, 15, 7, 0]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
