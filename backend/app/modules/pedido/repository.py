from sqlmodel import col, select

from app.core.repository import BaseRepository
from app.modules.producto.model import Producto

from .model import DetallePedido, Pedido


class PedidoRepository(BaseRepository[Pedido]):
    model = Pedido

    # Consultas propias del dominio, además del CRUD heredado.
    # "Activo" = no borrado lógicamente (deleted_at vacío).

    def listar_activos(self) -> list[Pedido]:
        consulta = (
            select(Pedido)
            .where(col(Pedido.deleted_at).is_(None))
            .order_by(col(Pedido.id))
        )
        return list(self.session.exec(consulta).all())

    def get_activo(self, pedido_id: int) -> Pedido | None:
        consulta = select(Pedido).where(
            Pedido.id == pedido_id,
            col(Pedido.deleted_at).is_(None),
        )
        return self.session.exec(consulta).first()


class DetallePedidoRepository(BaseRepository[DetallePedido]):
    model = DetallePedido
    # No necesita nada propio: con create() heredado alcanza.


class ProductoRepository(BaseRepository[Producto]):
    """El módulo de pedidos necesita LEER productos (existe? cuánto sale?).
    Producto sigue con la arquitectura de la U7; este repositorio solo
    le da al Unit of Work de pedidos una forma de consultarlos."""

    model = Producto

    def get_activo(self, producto_id: int) -> Producto | None:
        consulta = select(Producto).where(
            Producto.id == producto_id,
            col(Producto.deleted_at).is_(None),
        )
        return self.session.exec(consulta).first()