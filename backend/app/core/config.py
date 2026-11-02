from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración leída del archivo .env (que NO se entrega: ver .env.example).

    Los secretos no tienen valor por defecto: si faltan en el .env, la app
    no arranca (fail-fast) en lugar de arrancar con una clave conocida.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # ─── Base de datos ─────────────────────────────────────────────
    # Obligatoria: incluye la contraseña de PostgreSQL, por eso vive en .env.
    database_url: str

    # ─── CORS ──────────────────────────────────────────────────────
    frontend_origin: str = "http://localhost:5173"

    # ─── JWT (TP 9) ────────────────────────────────────────────────
    SECRET_KEY: str = Field(min_length=32)   # obligatoria, sin valor por defecto
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30


settings = Settings()
