from fastapi import HTTPException, status
from sqlmodel import Session, col, select

from .model import UnidadMedida
from .schema import UnidadMedidaListResponse


def listar(session: Session) -> UnidadMedidaListResponse:
    items = session.exec(
        select(UnidadMedida)
        .where(col(UnidadMedida.deleted_at).is_(None))
        .order_by(UnidadMedida.id)
    ).all()
    return UnidadMedidaListResponse(items=list(items), total=len(items))


def obtener(session: Session, unidad_id: int) -> UnidadMedida:
    unidad = session.get(UnidadMedida, unidad_id)
    if unidad is None or unidad.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unidad de medida {unidad_id} no encontrada",
        )
    return unidad
