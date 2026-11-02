from fastapi import APIRouter, status

from app.core.deps import SESION, SOLO_ADMIN
from app.core.database import SessionDep
from app.core.params import InactivosParam, LimitParam, NombreParam, OffsetParam

from . import service
from .schema import (
    CategoriaDeProducto,
    IngredienteDeProducto,
    ProductoCreate,
    ProductoPaginatedResponse,
    ProductoRead,
    ProductoUpdate,
)

router = APIRouter(prefix="/productos", tags=["Productos"], dependencies=SESION)


@router.get("/", response_model=ProductoPaginatedResponse)
def listar_productos(
    session: SessionDep,
    offset: OffsetParam = 0,
    limit: LimitParam = 10,
    nombre: NombreParam = None,
    incluir_inactivos: InactivosParam = False,
):
    return service.listar(session, offset, limit, nombre, incluir_inactivos)


@router.post("/", response_model=ProductoRead, status_code=status.HTTP_201_CREATED, dependencies=SOLO_ADMIN)
def crear_producto(data: ProductoCreate, session: SessionDep):
    return service.crear(session, data)


@router.get("/{producto_id}", response_model=ProductoRead)
def obtener_producto(producto_id: int, session: SessionDep):
    return service.obtener(session, producto_id)


@router.put("/{producto_id}", response_model=ProductoRead, dependencies=SOLO_ADMIN)
def actualizar_producto(producto_id: int, data: ProductoUpdate, session: SessionDep):
    return service.actualizar(session, producto_id, data)


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=SOLO_ADMIN)
def eliminar_producto(producto_id: int, session: SessionDep) -> None:
    service.eliminar(session, producto_id)


@router.get("/{producto_id}/categorias", response_model=list[CategoriaDeProducto])
def listar_categorias_de_producto(producto_id: int, session: SessionDep):
    return service.listar_categorias(session, producto_id)

@router.get("/{producto_id}/ingredientes", response_model=list[IngredienteDeProducto])
def listar_ingredientes_de_producto(producto_id: int, session: SessionDep):
    return service.listar_ingredientes(session, producto_id)
