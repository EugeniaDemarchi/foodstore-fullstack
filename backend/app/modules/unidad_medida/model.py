from sqlmodel import Field

from app.core.audit import AuditMixin


class UnidadMedida(AuditMixin, table=True):
    """Tabla CATÁLOGO: se carga desde seed.py y la API solo la lee."""

    __tablename__ = "unidad_medida"

    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(unique=True, max_length=50)
    simbolo: str = Field(max_length=10)
    tipo: str = Field(max_length=20)  # masa, volumen, unidad, area
