import os
import uuid
import mimetypes
from abc import ABC, abstractmethod
from typing import Tuple, Optional
import boto3
from botocore.exceptions import ClientError
from fastapi import HTTPException, status
from app.core.config import settings

class BaseStorageProvider(ABC):
    @abstractmethod
    def save_file(self, file_bytes: bytes, original_filename: str, content_type: str) -> Tuple[str, str]:
        """Returns (storage_key, safe_filename)"""
        pass

    @abstractmethod
    def get_file_content(self, storage_key: str) -> Tuple[bytes, str]:
        """Returns (file_bytes, content_type)"""
        pass

    @abstractmethod
    def get_download_url(self, storage_key: str, original_filename: str) -> Optional[str]:
        """Returns presigned URL if cloud, or None for local API streaming"""
        pass

    @abstractmethod
    def delete_file(self, storage_key: str) -> bool:
        pass


class LocalStorageProvider(BaseStorageProvider):
    def __init__(self, base_dir: str):
        self.base_dir = os.path.abspath(base_dir)
        os.makedirs(self.base_dir, exist_ok=True)

    def _sanitize_extension(self, filename: str) -> str:
        ext = os.path.splitext(filename)[1].lower().lstrip(".")
        if ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format .{ext}. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )
        return ext

    def _get_safe_path(self, storage_key: str) -> str:
        # Prevent Path Traversal attacks (e.g. ../../etc/passwd)
        safe_path = os.path.abspath(os.path.join(self.base_dir, storage_key))
        if not safe_path.startswith(self.base_dir):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: Invalid file path")
        return safe_path

    def save_file(self, file_bytes: bytes, original_filename: str, content_type: str) -> Tuple[str, str]:
        ext = self._sanitize_extension(original_filename)
        safe_name = f"fdr_{uuid.uuid4().hex}.{ext}"
        storage_path = self._get_safe_path(safe_name)
        
        with open(storage_path, "wb") as f:
            f.write(file_bytes)
            
        return safe_name, safe_name

    def get_file_content(self, storage_key: str) -> Tuple[bytes, str]:
        file_path = self._get_safe_path(storage_key)
        if not os.path.isfile(file_path):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document file not found on server")
        
        content_type, _ = mimetypes.guess_type(file_path)
        content_type = content_type or "application/octet-stream"
        
        with open(file_path, "rb") as f:
            data = f.read()
        return data, content_type

    def get_download_url(self, storage_key: str, original_filename: str) -> Optional[str]:
        # For local storage, returns backend endpoint URL
        return f"{settings.API_V1_STR}/documents/download/{storage_key}"

    def delete_file(self, storage_key: str) -> bool:
        file_path = self._get_safe_path(storage_key)
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False


class S3StorageProvider(BaseStorageProvider):
    def __init__(self, bucket_name: str, region_name: str = "ap-southeast-2"):
        self.bucket_name = bucket_name
        self.region_name = region_name
        self.client = boto3.client("s3", region_name=self.region_name)

    def save_file(self, file_bytes: bytes, original_filename: str, content_type: str) -> Tuple[str, str]:
        ext = os.path.splitext(original_filename)[1].lower().lstrip(".")
        safe_name = f"fdr_{uuid.uuid4().hex}.{ext}"
        key = f"documents/{safe_name}"
        
        try:
            self.client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=file_bytes,
                ContentType=content_type,
                ServerSideEncryption="AES256",
                Metadata={"original_filename": original_filename}
            )
            return key, safe_name
        except ClientError as e:
            # Fall back to local if S3 upload fails due to credentials/permissions
            print(f"[AWS S3 Warning] Could not upload to S3: {e}. Falling back to local storage.")
            local_fallback = LocalStorageProvider(settings.STORAGE_DIR)
            return local_fallback.save_file(file_bytes, original_filename, content_type)

    def get_file_content(self, storage_key: str) -> Tuple[bytes, str]:
        try:
            response = self.client.get_object(Bucket=self.bucket_name, Key=storage_key)
            data = response["Body"].read()
            content_type = response.get("ContentType", "application/octet-stream")
            return data, content_type
        except ClientError:
            local_fallback = LocalStorageProvider(settings.STORAGE_DIR)
            return local_fallback.get_file_content(storage_key)

    def get_download_url(self, storage_key: str, original_filename: str) -> Optional[str]:
        try:
            url = self.client.generate_presigned_url(
                ClientMethod="get_object",
                Params={
                    "Bucket": self.bucket_name,
                    "Key": storage_key,
                    "ResponseContentDisposition": f'inline; filename="{original_filename}"'
                },
                ExpiresIn=900  # 15 minutes
            )
            return url
        except Exception:
            return f"{settings.API_V1_STR}/documents/download/{storage_key}"

    def delete_file(self, storage_key: str) -> bool:
        try:
            self.client.delete_object(Bucket=self.bucket_name, Key=storage_key)
            return True
        except ClientError:
            return False


def get_storage() -> BaseStorageProvider:
    if settings.USE_AWS_S3 and settings.S3_BUCKET_NAME:
        try:
            return S3StorageProvider(bucket_name=settings.S3_BUCKET_NAME, region_name=settings.AWS_REGION)
        except Exception as e:
            print(f"[Storage Provider] Error initializing S3 provider: {e}. Using Local storage.")
            return LocalStorageProvider(settings.STORAGE_DIR)
    return LocalStorageProvider(settings.STORAGE_DIR)
