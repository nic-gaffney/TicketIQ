from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    PROJECT_NAME: str = "TicketIQ"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    SECRET_KEY: str = "changeme"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173"]

    DATABASE_URL: str = "postgresql+asyncpg://appuser:apppassword@localhost:5432/appdb"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


settings = Settings()
