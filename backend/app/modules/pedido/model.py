from datetime import datetime
from enum import Enum

from sqlmodel import Field, Relationship, SQLModel

from app.core.audit import utc_now


class EstadoPedido(str, Enum):
    """Los únicos estados válidos. Hereda de str: en la base se guarda
    como texto ("PENDIENTE"), tal como pide la consigna."""

    PENDIENTE = "PENDIENTE"
    CONFIRMADO = "CONFIRMADO"
    ENTREGADO = "ENTREGADO"
    CANCELADO = "CANCELADO"


class DetallePedido(SQLModel, table=True):
    """Una línea del pedido: qué producto, cuántos y a qué precio."""

    __tablename__ = "detalle_pedido"

    # PK COMPUESTA (pedido_id, producto_id), como en el UML:
    # un mismo producto no puede aparecer dos veces en el mismo pedido.
    pedido_id: int = Field(
        foreign_key="pedido.id", primary_key=True, ondelete="CASCADE"
    )
    producto_id: int = Field(
        foreign_key="producto.id", primary_key=True, ondelete="RESTRICT"
    )
    cantidad: int
    # "Foto" del precio al momento de comprar: si mañana el producto
    # aumenta, este pedido conserva el precio que se pagó.
    precio_unitario: float


class Pedido(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    fecha: datetime = Field(default_factory=utc_now)  # la asigna el backend
    estado: str = Field(default=EstadoPedido.PENDIENTE.value, max_length=20)
    total: float = Field(default=0)
    deleted_at: datetime | None = Field(default=None, index=True)  # borrado lógico

    # Relación 1 a N: un pedido tiene muchos detalles.
    detalles: list[DetallePedido] = Relationship()