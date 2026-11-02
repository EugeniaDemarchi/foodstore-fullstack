from datetime import datetime

from pydantic import field_validator
from sqlmodel import Field, SQLModel

from .model import EstadoPedido


# ---------- Entrada (lo que manda el cliente) ----------

class DetalleCreate(SQLModel):
    producto_id: int
    cantidad: int = Field(ge=1)  # cantidad menor que 1 -> 422


class PedidoCreate(SQLModel):
    # RN-12: al menos un detalle -> una lista vacía responde 422
    detalles: list[DetalleCreate] = Field(min_length=1)

    @field_validator("detalles")
    @classmethod
    def sin_productos_repetidos(cls, detalles: list[DetalleCreate]) -> list[DetalleCreate]:
        # RN-12: el mismo producto no se repite. Se valida ACÁ, antes de
        # tocar la base: sin esto, la PK compuesta rechazaría el segundo
        # detalle con un IntegrityError y el cliente recibiría un 500.
        ids = [d.producto_id for d in detalles]
        if len(ids) != len(set(ids)):
            raise ValueError("un mismo producto no puede repetirse en el pedido")
        return detalles


class PedidoUpdate(SQLModel):
    # Al tiparlo con el Enum, Pydantic rechaza cualquier otro texto -> 422
    estado: EstadoPedido


# ---------- Salida (lo que devuelve la API) ----------

class DetalleRead(SQLModel):
    producto_id: int
    cantidad: int
    precio_unitario: float


class PedidoRead(SQLModel):
    """Para el listado: el pedido sin sus detalles."""
    id: int
    fecha: datetime
    estado: EstadoPedido
    total: float


class PedidoConDetalles(PedidoRead):
    """Para GET /pedidos/{id} y POST: el pedido con sus líneas."""
    detalles: list[DetalleRead] = []