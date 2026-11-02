from sqlmodel import Field, Relationship

from app.core.audit import AuditMixin
from app.modules.unidad_medida.model import UnidadMedida


class Ingrediente(AuditMixin, table=True):
    id: int | None = Field(default=None, primary_key=True)
    # Sin unique=True: igual que en Categoría, la unicidad entre ACTIVOS
    # (sin distinguir mayúsculas) la controla el service.
    nombre: str = Field(index=True, max_length=100)
    descripcion: str = Field(default="")
    # Unidad en la que se mide el ingrediente (p. ej. harina -> gramo).
    unidad_medida_id: int = Field(foreign_key="unidad_medida.id", ondelete="RESTRICT")

    unidad_medida: UnidadMedida = Relationship()
