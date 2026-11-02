from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import SESION, SOLO_ADMIN, USER_O_ADMIN
from app.core.database import session_factory

from .schema import PedidoConDetalles, PedidoCreate, PedidoRead, PedidoUpdate
from .service import PedidoNoEncontrado, PedidoService, ProductoNoEncontrado
from .unit_of_work import PedidoUnitOfWork


# Función proveedora: arma el Service con su Unit of Work.
# FastAPI la llama en cada request (inyección de dependencias).
def get_pedido_service() -> PedidoService:
    return PedidoService(PedidoUnitOfWork(session_factory))


ServiceDep = Annotated[PedidoService, Depends(get_pedido_service)]

router = APIRouter(prefix="/pedidos", tags=["pedidos"], dependencies=SESION)


def _no_encontrado(error: Exception) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))


@router.get("/", response_model=list[PedidoRead])
def listar_pedidos(service: ServiceDep):
    return service.listar()


@router.get("/{pedido_id}", response_model=PedidoConDetalles)
def obtener_pedido(pedido_id: int, service: ServiceDep):
    try:
        return service.obtener(pedido_id)
    except PedidoNoEncontrado as e:
        raise _no_encontrado(e)


@router.post("/", response_model=PedidoConDetalles, status_code=status.HTTP_201_CREATED, dependencies=USER_O_ADMIN)
def crear_pedido(data: PedidoCreate, service: ServiceDep):
    # Si data no cumple PedidoCreate, FastAPI ya respondió 422 antes de llegar acá.
    try:
        return service.crear(data)
    except ProductoNoEncontrado as e:
        raise _no_encontrado(e)


@router.put("/{pedido_id}", response_model=PedidoConDetalles, dependencies=SOLO_ADMIN)
def actualizar_estado_pedido(pedido_id: int, data: PedidoUpdate, service: ServiceDep):
    try:
        return service.actualizar_estado(pedido_id, data)
    except PedidoNoEncontrado as e:
        raise _no_encontrado(e)


@router.delete("/{pedido_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=SOLO_ADMIN)
def eliminar_pedido(pedido_id: int, service: ServiceDep) -> None:
    try:
        service.eliminar(pedido_id)
    except PedidoNoEncontrado as e:
        raise _no_encontrado(e)