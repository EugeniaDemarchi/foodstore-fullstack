from app.core.audit import utc_now

from .model import DetallePedido, Pedido
from .schema import PedidoConDetalles, PedidoCreate, PedidoRead, PedidoUpdate
from .unit_of_work import PedidoUnitOfWork


# ---------- Errores de negocio ----------
# El Service no sabe nada de HTTP: lanza errores "de negocio" y el Router
# decide qué código HTTP corresponde a cada uno.

class PedidoNoEncontrado(Exception):
    def __init__(self, pedido_id: int):
        super().__init__(f"Pedido {pedido_id} no encontrado")


class ProductoNoEncontrado(Exception):
    def __init__(self, producto_id: int):
        super().__init__(f"Producto {producto_id} no encontrado")


class PedidoService:
    def __init__(self, uow: PedidoUnitOfWork):
        self.uow = uow

    # ---------- Lectura ----------

    def listar(self) -> list[PedidoRead]:
        with self.uow as uow:
            return [PedidoRead.model_validate(p) for p in uow.pedidos.listar_activos()]

    def obtener(self, pedido_id: int) -> PedidoConDetalles:
        with self.uow as uow:
            pedido = self._buscar(uow, pedido_id)
            return PedidoConDetalles.model_validate(pedido)

    # ---------- Escritura ----------

    def crear(self, data: PedidoCreate) -> PedidoConDetalles:
        # Las reglas de forma (al menos 1 detalle, cantidad >= 1, sin
        # productos repetidos) ya las validó PedidoCreate: si llegamos acá,
        # los datos tienen la forma correcta.
        with self.uow as uow:
            # 1) El pedido. Tras el flush de create() ya tiene id.
            pedido = uow.pedidos.create(Pedido())
            total = 0.0

            # 2) Un detalle por cada ítem.
            for item in data.detalles:
                producto = uow.productos.get_activo(item.producto_id)
                if producto is None:
                    # Esta excepción sale del with -> el UoW hace ROLLBACK:
                    # se descarta TODO, incluso el pedido del paso 1.
                    raise ProductoNoEncontrado(item.producto_id)

                uow.detalles.create(
                    DetallePedido(
                        pedido_id=pedido.id,
                        producto_id=producto.id,
                        cantidad=item.cantidad,
                        precio_unitario=producto.precio_base,
                    )
                )
                total += item.cantidad * producto.precio_base

            # 3) El total se calcula en el backend, nunca lo manda el cliente.
            pedido.total = round(total, 2)
            uow.pedidos.update(pedido)

            # Se convierte DENTRO del with: después del commit la sesión
            # se cierra y el objeto ya no se puede leer.
            return PedidoConDetalles.model_validate(pedido)
        # Al salir sin errores -> COMMIT: pedido y detalles juntos.

    def actualizar_estado(self, pedido_id: int, data: PedidoUpdate) -> PedidoConDetalles:
        with self.uow as uow:
            pedido = self._buscar(uow, pedido_id)
            pedido.estado = data.estado.value
            uow.pedidos.update(pedido)
            return PedidoConDetalles.model_validate(pedido)

    def eliminar(self, pedido_id: int) -> None:
        """Borrado LÓGICO: no se borra la fila, se marca deleted_at."""
        with self.uow as uow:
            pedido = self._buscar(uow, pedido_id)
            pedido.deleted_at = utc_now()
            uow.pedidos.update(pedido)

    # ---------- Auxiliar ----------

    @staticmethod
    def _buscar(uow: PedidoUnitOfWork, pedido_id: int) -> Pedido:
        """RN-13: inexistente o eliminado -> mismo error (404)."""
        pedido = uow.pedidos.get_activo(pedido_id)
        if pedido is None:
            raise PedidoNoEncontrado(pedido_id)
        return pedido