from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    # Siempre UTC: el servidor no debe depender de la zona horaria de la máquina.
    return datetime.now(timezone.utc)


class AuditMixin(SQLModel):
    """Campos de auditoría compartidos. NO es tabla (no tiene table=True):
    solo aporta columnas a las clases que lo heredan."""

    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    deleted_at: datetime | None = Field(default=None, index=True)