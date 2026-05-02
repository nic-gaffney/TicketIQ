from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    PROJECT_NAME: str = "TicketIQ"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    SECRET_KEY: str = "changeme"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    DATABASE_URL: str = "postgresql+asyncpg://appuser:apppassword@localhost:5432/appdb"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8
    UPLOAD_DIR: Path = Path("/tmp/ticketiq_uploads")
    ESCALATION_JOB_INTERVAL_SECONDS: int = 120

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


settings = Settings()
