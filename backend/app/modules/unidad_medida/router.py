from fastapi import APIRouter

from app.core.deps import SESION
from app.core.database import SessionDep

from . import service
from .schema import UnidadMedidaListResponse, UnidadMedidaRead

# Catálogo de SOLO LECTURA: no hay POST / PUT / PATCH / DELETE (nota del PDF).
router = APIRouter(prefix="/unidades-medida", tags=["Unidades de Medida"], dependencies=SESION)


@router.get("/", response_model=UnidadMedidaListResponse)
def listar_unidades(session: SessionDep):
    return service.listar(session)


@router.get("/{unidad_id}", response_model=UnidadMedidaRead)
def obtener_unidad(unidad_id: int, session: SessionDep):
    return service.obtener(session, unidad_id)
