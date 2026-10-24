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

    pmo_data_folder: Path = PROJECT_ROOT / "data_PMO"
    pp_data_folder: Path = PROJECT_ROOT / "data_PP"

    @field_validator("pmo_data_folder", "pp_data_folder")
    @classmethod
    def resolve_data_folder(cls, value: Path) -> Path:
        return value.expanduser().resolve()


@lru_cache
def get_settings() -> Settings:
    return Settings()
