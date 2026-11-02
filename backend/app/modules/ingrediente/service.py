from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import selectinload
from sqlmodel import Session, col, select

from app.core.audit import utc_now
from app.core.pagination import paginar
from app.modules.producto.model import Producto, ProductoIngrediente
from app.modules.unidad_medida import service as unidad_service

from .model import Ingrediente
from .schema import IngredienteCreate, IngredientePaginatedResponse, IngredienteUpdate


def _consulta_base():
    return (
        select(Ingrediente)
        .options(selectinload(Ingrediente.unidad_medida))
        .order_by(Ingrediente.id)
    )


# ---------- Lectura ----------

def listar(
    session: Session,
    offset: int,
    limit: int,
    nombre: str | None = None,
    incluir_inactivos: bool = False,
) -> IngredientePaginatedResponse:
    consulta = _consulta_base()
    if not incluir_inactivos:
        consulta = consulta.where(col(Ingrediente.deleted_at).is_(None))
    if nombre:
        consulta = consulta.where(col(Ingrediente.nombre).ilike(f"%{nombre.strip()}%"))

    items, total = paginar(session, consulta, offset, limit)
    return IngredientePaginatedResponse(items=items, total=total, offset=offset, limit=limit)


def obtener(session: Session, ingrediente_id: int) -> Ingrediente:
    """Devuelve el ingrediente ACTIVO o lanza 404."""
    ingrediente = session.exec(
        _consulta_base().where(
            Ingrediente.id == ingrediente_id,
            col(Ingrediente.deleted_at).is_(None),
        )
    ).first()
    if ingrediente is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ingrediente {ingrediente_id} no encontrado",
        )
    return ingrediente


# ---------- Reglas de negocio ----------

def _validar_nombre_unico(session: Session, nombre: str, excluir_id: int | None = None) -> None:
    """Mismo criterio que RN-02: único entre ACTIVOS, sin distinguir mayúsculas."""
    consulta = select(Ingrediente).where(
        func.lower(Ingrediente.nombre) == nombre.lower(),
        col(Ingrediente.deleted_at).is_(None),
    )
    if excluir_id is not None:
        consulta = consulta.where(Ingrediente.id != excluir_id)
    if session.exec(consulta).first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un ingrediente llamado '{nombre}'",
        )


def _validar_sin_productos_activos(session: Session, ingrediente_id: int) -> None:
    """Mismo criterio que RN-05: no se borra un ingrediente que usan productos activos."""
    cantidad = session.exec(
        select(func.count())
        .select_from(ProductoIngrediente)
        .join(Producto, Producto.id == ProductoIngrediente.producto_id)
        .where(
            ProductoIngrediente.ingrediente_id == ingrediente_id,
            col(Producto.deleted_at).is_(None),
        )
    ).one()
    if cantidad > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El ingrediente {ingrediente_id} lo usan {cantidad} producto(s)",
        )


# ---------- Escritura ----------

def crear(session: Session, data: IngredienteCreate) -> Ingrediente:
    unidad_service.obtener(session, data.unidad_medida_id)  # 404 si no existe
    _validar_nombre_unico(session, data.nombre)            # 409
    ingrediente = Ingrediente.model_validate(data)
    session.add(ingrediente)
    session.commit()
    return obtener(session, ingrediente.id)


def actualizar(session: Session, ingrediente_id: int, data: IngredienteUpdate) -> Ingrediente:
    ingrediente = obtener(session, ingrediente_id)                          # 404
    unidad_service.obtener(session, data.unidad_medida_id)                  # 404
    _validar_nombre_unico(session, data.nombre, excluir_id=ingrediente_id)  # 409
    ingrediente.sqlmodel_update(data.model_dump())
    ingrediente.updated_at = utc_now()
    session.add(ingrediente)
    session.commit()
    return obtener(session, ingrediente_id)


def eliminar(session: Session, ingrediente_id: int) -> None:
    """Borrado LÓGICO."""
    ingrediente = obtener(session, ingrediente_id)          # 404
    _validar_sin_productos_activos(session, ingrediente_id)  # 409
    ahora = utc_now()
    ingrediente.deleted_at = ahora
    ingrediente.updated_at = ahora
    session.add(ingrediente)
    session.commit()
