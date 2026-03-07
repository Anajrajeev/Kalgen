import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

@dataclass
class Settings:
    aws_access_key: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    aws_secret_key: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    aws_region: str = os.getenv("AWS_REGION", "us-east-1")
    user_name: str = os.getenv("USER_NAME", "")
    chroma_dir: str = os.getenv("CHROMA_DIR", "./data/chroma_store")

settings = Settings()
