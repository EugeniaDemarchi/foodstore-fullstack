from sqlmodel import Field

from app.core.audit import AuditMixin


class Categoria(AuditMixin, table=True):
    id: int | None = Field(default=None, primary_key=True)
    # Sin unique=True: la unicidad (sin distinguir mayúsculas y solo entre
    # categorías activas) la controla el service -> RN-02.
    nombre: str = Field(index=True, max_length=100)
    descripcion: str = Field(default="")