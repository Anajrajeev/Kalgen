from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from functools import lru_cache

import boto3
from botocore.config import Config
from pydantic import model_validator


class Settings(BaseSettings):
    # Supabase Configuration
    supabase_url: str
    supabase_key: str
    supabase_service_key: str
    
    # JWT Configuration
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # FastAPI Configuration
    debug: bool = True
    cors_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"]
    
    # AWS Configuration
    app_name: str = "AgriNiti API"
    aws_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_session_token: Optional[str] = None

    # S3 for Amazon Transcribe batch jobs
    transcribe_input_bucket: str = ""
    transcribe_input_prefix: str = "language-service/input"
    transcribe_output_bucket: str = ""
    transcribe_output_prefix: str = "language-service/output"

    # Optional: comma-separated list for streaming
    transcribe_streaming_language_options: str = ""

    @model_validator(mode="after")
    def validate_aws_credentials(self) -> "Settings":
        # Only validate AWS credentials if translation features are used
        if self.transcribe_input_bucket or self.transcribe_output_bucket:
            if not (self.aws_access_key_id or "").strip():
                raise ValueError(
                    "Missing AWS credentials in .env\n"
                    "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY for translation features."
                )
            if not (self.aws_secret_access_key or "").strip():
                raise ValueError(
                    "Missing AWS credentials in .env\n"
                    "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY for translation features."
                )
        return self

    # Database Configuration
    # Database Configuration - Set this in .env for Supabase
    database_url: str = "" 

    model_config = {"env_file": ".env", "extra": "ignore"}


# AWS Configuration Functions
_ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_ENV_FILE = os.path.join(_ROOT_DIR, ".env")


def _read_env_file(path: str) -> dict[str, str]:
    """Parse .env file and return key=value dict. Used for AWS credentials so env vars cannot override .env."""
    out: dict[str, str] = {}
    if not os.path.isfile(path):
        return out
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, _, value = line.partition("=")
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                out[key] = value
    return out


def _get_aws_credentials_from_env_file() -> tuple[str, str, Optional[str], str]:
    """Read AWS credentials and region only from .env file (ignore os.environ). Ensures .env always wins."""
    env = _read_env_file(_ENV_FILE)
    access_key = (env.get("AWS_ACCESS_KEY_ID") or "").strip()
    secret_key = (env.get("AWS_SECRET_ACCESS_KEY") or "").strip()
    session_token = (env.get("AWS_SESSION_TOKEN") or "").strip() or None
    region = (env.get("AWS_REGION") or "").strip() or "us-east-1"
    return access_key, secret_key, session_token, region


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Cached at startup. Restart the server after changing .env (e.g. AWS credentials)."""
    return Settings()


def _build_boto_config() -> Config:
    _, _, _, region = _get_aws_credentials_from_env_file()
    return Config(
        region_name=region,
        retries={"max_attempts": 3, "mode": "standard"},
        connect_timeout=5,
        read_timeout=30,
        max_pool_connections=50,
        tcp_keepalive=True,
    )


@lru_cache(maxsize=1)
def get_boto3_session() -> boto3.session.Session:
    """Create a boto3 Session using only credentials from .env file (env vars cannot override). Cached; restart after changing .env."""
    access_key, secret_key, session_token, region = _get_aws_credentials_from_env_file()
    
    # Return a session with default credentials if AWS keys are not set
    # This allows the backend to run without AWS credentials when translation features aren't used
    if not access_key or not secret_key:
        return boto3.Session(region_name=region)
    
    return boto3.Session(
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        aws_session_token=session_token,
        region_name=region,
    )


@lru_cache(maxsize=1)
def get_translate_client():
    return get_boto3_session().client("translate", config=_build_boto_config())


@lru_cache(maxsize=1)
def get_transcribe_client():
    return get_boto3_session().client("transcribe", config=_build_boto_config())


@lru_cache(maxsize=1)
def get_polly_client():
    return get_boto3_session().client("polly", config=_build_boto_config())


@lru_cache(maxsize=1)
def get_s3_client():
    return get_boto3_session().client("s3", config=_build_boto_config())


def build_s3_uri(bucket: str, key: str) -> str:
    normalized_key = key.lstrip("/")
    return f"s3://{bucket}/{normalized_key}"


def build_prefixed_key(prefix: str, filename: str) -> str:
    cleaned_prefix = (prefix or "").strip("/")
    safe_filename = os.path.basename(filename)
    if cleaned_prefix:
        return f"{cleaned_prefix}/{safe_filename}"
    return safe_filename


settings = Settings()
