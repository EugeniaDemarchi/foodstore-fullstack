from datetime import datetime

from pydantic import field_validator
from sqlmodel import Field, SQLModel

from app.core.pagination import PaginatedResponse
from app.core.validators import texto_obligatorio


class UnidadMedidaResumen(SQLModel):
    id: int
    simbolo: str


class IngredienteBase(SQLModel):
    nombre: str = Field(min_length=1, max_length=100)
    descripcion: str = ""
    unidad_medida_id: int

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, valor: str) -> str:
        return texto_obligatorio(valor)


class IngredienteCreate(IngredienteBase):
    pass


class IngredienteUpdate(IngredienteBase):
    pass


class IngredienteRead(IngredienteBase):
    id: int
    unidad_medida: UnidadMedidaResumen
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None


class IngredientePaginatedResponse(PaginatedResponse[IngredienteRead]):
    """Listado paginado de ingredientes."""
