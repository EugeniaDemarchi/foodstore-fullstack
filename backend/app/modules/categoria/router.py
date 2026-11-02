from fastapi import APIRouter, status

from app.core.deps import SESION, SOLO_ADMIN
from app.core.database import SessionDep
from app.core.params import InactivosParam, LimitParam, NombreParam, OffsetParam
from app.modules.producto import service as producto_service
from app.modules.producto.schema import ProductoRead

from . import service
from .schema import CategoriaCreate, CategoriaPaginatedResponse, CategoriaRead, CategoriaUpdate

router = APIRouter(prefix="/categorias", tags=["Categorías"], dependencies=SESION)


@router.get("/", response_model=CategoriaPaginatedResponse)
def listar_categorias(
    session: SessionDep,
    offset: OffsetParam = 0,
    limit: LimitParam = 10,
    nombre: NombreParam = None,
    incluir_inactivos: InactivosParam = False,
):
    return service.listar(session, offset, limit, nombre, incluir_inactivos)


@router.post("/", response_model=CategoriaRead, status_code=status.HTTP_201_CREATED, dependencies=SOLO_ADMIN)
def crear_categoria(data: CategoriaCreate, session: SessionDep):
    return service.crear(session, data)


@router.get("/{categoria_id}", response_model=CategoriaRead)
def obtener_categoria(categoria_id: int, session: SessionDep):
    return service.obtener(session, categoria_id)


@router.put("/{categoria_id}", response_model=CategoriaRead, dependencies=SOLO_ADMIN)
def actualizar_categoria(categoria_id: int, data: CategoriaUpdate, session: SessionDep):
    return service.actualizar(session, categoria_id, data)


@router.delete("/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=SOLO_ADMIN)
def eliminar_categoria(categoria_id: int, session: SessionDep) -> None:
    service.eliminar(session, categoria_id)


@router.get("/{categoria_id}/productos", response_model=list[ProductoRead])
def listar_productos_de_categoria(categoria_id: int, session: SessionDep):
    return producto_service.listar_por_categoria(session, categoria_id)