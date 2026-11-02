from fastapi import APIRouter, status

from app.core.deps import SESION, SOLO_ADMIN
from app.core.database import SessionDep
from app.core.params import InactivosParam, LimitParam, NombreParam, OffsetParam

from . import service
from .schema import (
    IngredienteCreate,
    IngredientePaginatedResponse,
    IngredienteRead,
    IngredienteUpdate,
)

router = APIRouter(prefix="/ingredientes", tags=["Ingredientes"], dependencies=SESION)


@router.get("/", response_model=IngredientePaginatedResponse)
def listar_ingredientes(
    session: SessionDep,
    offset: OffsetParam = 0,
    limit: LimitParam = 10,
    nombre: NombreParam = None,
    incluir_inactivos: InactivosParam = False,
):
    return service.listar(session, offset, limit, nombre, incluir_inactivos)


@router.post("/", response_model=IngredienteRead, status_code=status.HTTP_201_CREATED, dependencies=SOLO_ADMIN)
def crear_ingrediente(data: IngredienteCreate, session: SessionDep):
    return service.crear(session, data)


@router.get("/{ingrediente_id}", response_model=IngredienteRead)
def obtener_ingrediente(ingrediente_id: int, session: SessionDep):
    return service.obtener(session, ingrediente_id)


@router.put("/{ingrediente_id}", response_model=IngredienteRead, dependencies=SOLO_ADMIN)
def actualizar_ingrediente(ingrediente_id: int, data: IngredienteUpdate, session: SessionDep):
    return service.actualizar(session, ingrediente_id, data)


@router.delete("/{ingrediente_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=SOLO_ADMIN)
def eliminar_ingrediente(ingrediente_id: int, session: SessionDep) -> None:
    service.eliminar(session, ingrediente_id)
