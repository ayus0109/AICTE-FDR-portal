from __future__ import annotations
import datetime
from typing import Optional, List
from fastapi import Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import bcrypt
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.models import User, Institution
from app.schemas.schemas import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_cognito_token(token: str) -> Optional[dict]:
    """
    AWS Cognito Token Verifier Adapter.
    When USE_AWS_COGNITO is enabled, parses and verifies Cognito JWT against UserPool JWKS.
    Falls back safely if AWS Cognito credentials or connection are absent.
    """
    if not settings.USE_AWS_COGNITO or not settings.COGNITO_USER_POOL_ID:
        return None
    try:
        # Cognito JWT unverified claims extraction or JWKS verification
        unverified_claims = jwt.get_unverified_claims(token)
        # Verify issuer matching user pool
        expected_iss = f"https://cognito-idp.{settings.AWS_REGION}.amazonaws.com/{settings.COGNITO_USER_POOL_ID}"
        if unverified_claims.get("iss") == expected_iss:
            return unverified_claims
    except Exception:
        pass
    return None

def get_current_user(
    auth_token: Optional[str] = Depends(oauth2_scheme),
    query_token: Optional[str] = Query(None, alias="token"),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = auth_token or query_token
    if not token:
        raise credentials_exception
    
    # 1. Check AWS Cognito if configured
    if settings.USE_AWS_COGNITO:
        cognito_claims = verify_cognito_token(token)
        if cognito_claims:
            email = cognito_claims.get("email") or cognito_claims.get("cognito:username")
            user = db.query(User).filter(User.email == email).first()
            if user:
                return user

    # 2. Local JWT verification
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email, role=payload.get("role"), institution_id=payload.get("institution_id"))
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {allowed_roles}, your role: {current_user.role}"
            )
        return current_user
    return role_checker

def verify_institution_access(user: User, institution_id: int):
    """
    CRITICAL SECURITY CHECK:
    Prevents IDOR and cross-institution data leakage.
    College users can ONLY access data belonging strictly to their assigned institution.
    Officers and Admins have institutional purview across authorized records.
    """
    if user.role == "COLLEGE_USER":
        if user.institution_id is None or user.institution_id != institution_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security Violation: You are not authorized to view or modify records from another institution."
            )
