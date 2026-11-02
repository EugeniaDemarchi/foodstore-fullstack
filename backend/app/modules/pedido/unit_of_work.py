from app.core.unit_of_work import UnitOfWork

from .repository import DetallePedidoRepository, PedidoRepository, ProductoRepository


class PedidoUnitOfWork(UnitOfWork):
    """UoW del módulo pedidos: hereda el commit/rollback del UoW base
    y expone los TRES repositorios que necesitan sus casos de uso.
    Los tres comparten self.session -> están en la MISMA transacción."""

    def _crear_repositorios(self) -> None:
        self.pedidos = PedidoRepository(self.session)
        self.detalles = DetallePedidoRepository(self.session)
        self.productos = ProductoRepository(self.session)