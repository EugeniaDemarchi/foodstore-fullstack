from datetime import datetime

from pydantic import field_validator
from sqlmodel import Field, SQLModel

from app.core.pagination import PaginatedResponse
from app.core.validators import texto_obligatorio


class CategoriaBase(SQLModel):
    nombre: str = Field(min_length=1, max_length=100)   # RN-01
    descripcion: str = ""                                # RN-03

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, valor: str) -> str:
        return texto_obligatorio(valor)                  # RN-01: no solo espacios


class CategoriaCreate(CategoriaBase):
    pass


class CategoriaUpdate(CategoriaBase):
    # PUT = reemplazo total: pide exactamente los mismos campos que el alta.
    pass


class CategoriaRead(CategoriaBase):
    id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None


class CategoriaPaginatedResponse(PaginatedResponse[CategoriaRead]):
    """Listado paginado de categorías (nombre igual al de la tabla del PDF)."""