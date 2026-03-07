from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Mandi API
    DATA_GOV_API_KEY: str
    DATA_GOV_BASE_URL: str = "https://api.data.gov.in/resource"
    MANDI_RESOURCE_ID: str = "9ef84268-d588-465a-a308-a864a43d0070"
    CACHE_TTL_SECONDS: int = 60

    # Gemini Embeddings
    GEMINI_API_KEY: str

    # JWT Auth
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440  # 24 hours


settings = Settings()
