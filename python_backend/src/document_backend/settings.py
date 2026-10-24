from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    """Runtime settings, overridable with DOCUMENT_BACKEND_* environment variables."""

    model_config = SettingsConfigDict(
        env_prefix="DOCUMENT_BACKEND_",
        env_file=".env",
        extra="ignore",
    )

    data_folder: Path = PROJECT_ROOT / "data"
    public_data_path: str = "/data"

    @field_validator("data_folder")
    @classmethod
    def resolve_data_folder(cls, value: Path) -> Path:
        return value.expanduser().resolve()

    @field_validator("public_data_path")
    @classmethod
    def validate_public_data_path(cls, value: str) -> str:
        normalized = value.rstrip("/") or "/"
        if not normalized.startswith("/"):
            raise ValueError("public_data_path must be an absolute path")
        return normalized


@lru_cache
def get_settings() -> Settings:
    return Settings()
