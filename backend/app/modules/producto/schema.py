from datetime import datetime

from pydantic import field_validator
from sqlmodel import Field, SQLModel

from app.core.pagination import PaginatedResponse
from app.core.validators import texto_obligatorio


class CategoriaResumen(SQLModel):
    """Versión reducida de una categoría, para anidarla dentro de un producto."""
    id: int
    nombre: str


class CategoriaDeProducto(CategoriaResumen):
    """Categoría vista desde un producto: incluye si es la principal."""
    es_principal: bool   


class ProductoBase(SQLModel):
    nombre: str = Field(min_length=1, max_length=150)            # RN-06
    descripcion: str = ""
    precio_base: float = Field(ge=0)                              # RN-07
    imagenes_url: list[str] = Field(default_factory=list)         # RN-09
    disponible: bool = True                                       # RN-08

    @field_validator("nombre")
    @classmethod
    def validar_nombre(cls, valor: str) -> str:
        return texto_obligatorio(valor)


class IngredienteCantidad(SQLModel):
    """Un ingrediente dentro del body de un producto: cuál y cuánto."""
    ingrediente_id: int
    cantidad: float = Field(gt=0)  # no tiene sentido "0 g de harina"


def _validar_ingredientes(items: list[IngredienteCantidad]) -> list[IngredienteCantidad]:
    ids = [item.ingrediente_id for item in items]
    if len(ids) != len(set(ids)):
        raise ValueError("un ingrediente no puede repetirse en el mismo producto")
    return items


class IngredienteDeProducto(SQLModel):
    """Respuesta de GET /productos/{id}/ingredientes."""
    id: int
    nombre: str
    cantidad: float
    unidad_medida: str  # símbolo, p. ej. "g"


def _sin_repetidos(ids: list[int]) -> list[int]:
    # dict.fromkeys conserva el orden: el primer id sigue siendo el primero.
    return list(dict.fromkeys(ids))


class ProductoCreate(ProductoBase):
    # RN-19: obligatorio y con al menos 1 id. El PRIMERO será la categoría principal.
    categoria_ids: list[int] = Field(min_length=1)
    # RN-20: opcionales. Si no vienen, el producto se crea sin ingredientes.
    ingredientes: list[IngredienteCantidad] = []

    @field_validator("categoria_ids")
    @classmethod
    def validar_categoria_ids(cls, ids: list[int]) -> list[int]:
        return _sin_repetidos(ids)

    @field_validator("ingredientes")
    @classmethod
    def validar_lista_ingredientes(cls, items: list[IngredienteCantidad]) -> list[IngredienteCantidad]:
        return _validar_ingredientes(items)


class ProductoUpdate(ProductoBase):
    # RN-12: opcional en el PUT. Si NO viene, las categorías quedan como estaban.
    # Si viene, reemplaza todas, y no puede venir vacía.
    categoria_ids: list[int] | None = None
    # RN-21: None = no tocar; lista (incluso vacía) = reemplaza TODOS los ingredientes.
    ingredientes: list[IngredienteCantidad] | None = None

    @field_validator("ingredientes")
    @classmethod
    def validar_lista_ingredientes(
        cls, items: list[IngredienteCantidad] | None
    ) -> list[IngredienteCantidad] | None:
        return None if items is None else _validar_ingredientes(items)

    @field_validator("categoria_ids")
    @classmethod
    def validar_categoria_ids(cls, ids: list[int] | None) -> list[int] | None:
        if ids is None:
            return None
        if len(ids) == 0:
            raise ValueError("si se envía, debe contener al menos una categoría")
        return _sin_repetidos(ids)


class ProductoRead(ProductoBase):
    id: int
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None
    categorias: list[CategoriaResumen] = []
    categoria_principal_id: int | None = None  # sale de la propiedad del modelo


class ProductoPaginatedResponse(PaginatedResponse[ProductoRead]):
    """Listado paginado de productos."""