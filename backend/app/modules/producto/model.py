from datetime import datetime

from sqlalchemy import JSON, Column
from sqlmodel import Field, Relationship, SQLModel

from app.modules.categoria.model import Categoria
from app.core.audit import AuditMixin, utc_now
from app.modules.ingrediente.model import Ingrediente


class ProductoCategoria(SQLModel, table=True):
    """Tabla intermedia de la relación N:M. Sigue el diagrama:
    sin deleted_at, porque es un vínculo y no una entidad."""

    __tablename__ = "producto_categoria"

    producto_id: int = Field(
        foreign_key="producto.id", primary_key=True, ondelete="CASCADE"
    )
    categoria_id: int = Field(
        foreign_key="categoria.id", primary_key=True, ondelete="RESTRICT", index=True
    )
    es_principal: bool = Field(default=False)
    created_at: datetime = Field(default_factory=utc_now)


class ProductoIngrediente(SQLModel, table=True):
    """Tabla intermedia Producto-Ingrediente. Además de unir, guarda un dato
    propio de la relación: CUÁNTO lleva el producto (en la unidad del ingrediente)."""

    __tablename__ = "producto_ingrediente"

    producto_id: int = Field(
        foreign_key="producto.id", primary_key=True, ondelete="CASCADE"
    )
    ingrediente_id: int = Field(
        foreign_key="ingrediente.id", primary_key=True, ondelete="RESTRICT", index=True
    )
    cantidad: float
    created_at: datetime = Field(default_factory=utc_now)

    ingrediente: Ingrediente = Relationship()


class Producto(AuditMixin, table=True):
    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(index=True, max_length=150)
    descripcion: str = Field(default="")
    precio_base: float
    imagenes_url: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    disponible: bool = Field(default=True)

    categorias: list[Categoria] = Relationship(link_model=ProductoCategoria)

    # Acceso de SOLO LECTURA (viewonly) a las filas de la tabla intermedia,
    # para poder leer es_principal. Los vínculos se siguen escribiendo en el service.
    vinculos: list[ProductoCategoria] = Relationship(
        sa_relationship_kwargs={"viewonly": True}
    )

    @property
    def categoria_principal_id(self) -> int | None:
        """Id de la categoría marcada como principal (o None si no hay)."""
        return next((v.categoria_id for v in self.vinculos if v.es_principal), None)