from typing import Generic, TypeVar

from pydantic import BaseModel
from sqlalchemy import func
from sqlmodel import Session, select
from sqlmodel.sql.expression import Select

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Respuesta estandarizada para TODOS los listados.
    T es "el tipo de cada item": se completa al usarla,
    p. ej. PaginatedResponse[CategoriaRead]."""

    items: list[T]
    total: int    # cuántos registros cumplen el filtro (sin paginar)
    offset: int   # cuántos se saltearon
    limit: int    # cuántos se pidieron como máximo


def paginar(session: Session, consulta: Select, offset: int, limit: int) -> tuple[list, int]:
    """Ejecuta una consulta de listado y devuelve (página de resultados, total).

    - total: se cuenta sobre la consulta YA filtrada, pero SIN offset/limit,
      para que el frontend sepa cuántas páginas hay.
    - items: la misma consulta con offset/limit aplicados.
    """
    total = session.exec(select(func.count()).select_from(consulta.subquery())).one()
    items = session.exec(consulta.offset(offset).limit(limit)).all()
    return list(items), total