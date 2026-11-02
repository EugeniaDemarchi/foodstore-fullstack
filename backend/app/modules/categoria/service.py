from fastapi import HTTPException, status
from sqlalchemy import func
from sqlmodel import Session, col, select

from app.core.audit import utc_now
from app.core.pagination import paginar
from app.modules.producto.model import Producto, ProductoCategoria

from .model import Categoria
from .schema import CategoriaCreate, CategoriaPaginatedResponse, CategoriaUpdate


# ---------- Lectura ----------

def listar(
    session: Session,
    offset: int,
    limit: int,
    nombre: str | None = None,
    incluir_inactivos: bool = False,
) -> CategoriaPaginatedResponse:
    # 1) Consulta base. order_by es obligatorio al paginar: sin un orden fijo,
    #    la base podría devolver las filas en distinto orden en cada página.
    consulta = select(Categoria).order_by(Categoria.id)

    # 2) Filtros dinámicos: solo se agregan si el parámetro vino.
    if not incluir_inactivos:
        consulta = consulta.where(col(Categoria.deleted_at).is_(None))
    if nombre:
        consulta = consulta.where(col(Categoria.nombre).ilike(f"%{nombre.strip()}%"))

    items, total = paginar(session, consulta, offset, limit)
    return CategoriaPaginatedResponse(items=items, total=total, offset=offset, limit=limit)


def obtener(session: Session, categoria_id: int) -> Categoria:
    """Devuelve la categoría ACTIVA o lanza 404 (RN-04).
    Una categoría borrada lógicamente se comporta como inexistente."""
    categoria = session.get(Categoria, categoria_id)
    if categoria is None or categoria.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Categoría {categoria_id} no encontrada",
        )
    return categoria


# ---------- Reglas de negocio ----------

def _validar_nombre_unico(session: Session, nombre: str, excluir_id: int | None = None) -> None:
    """RN-02: no puede haber dos categorías ACTIVAS con el mismo nombre,
    sin distinguir mayúsculas. Los espacios externos ya los quitó el schema."""
    consulta = select(Categoria).where(
        func.lower(Categoria.nombre) == nombre.lower(),
        col(Categoria.deleted_at).is_(None),
    )
    if excluir_id is not None:
        # Al editar, la propia categoría no cuenta como "duplicado" de sí misma.
        consulta = consulta.where(Categoria.id != excluir_id)

    if session.exec(consulta).first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe una categoría llamada '{nombre}'",
        )


def _validar_sin_productos_activos(session: Session, categoria_id: int) -> None:
    """RN-05: no se puede eliminar una categoría que agrupa productos activos."""
    cantidad = session.exec(
        select(func.count())
        .select_from(ProductoCategoria)
        .join(Producto, Producto.id == ProductoCategoria.producto_id)
        .where(
            ProductoCategoria.categoria_id == categoria_id,
            col(Producto.deleted_at).is_(None),
        )
    ).one()
    if cantidad > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"La categoría {categoria_id} tiene {cantidad} producto(s) asociado(s); "
                   "desasocialos o eliminalos antes de borrarla",
        )


# ---------- Escritura ----------

def crear(session: Session, data: CategoriaCreate) -> Categoria:
    _validar_nombre_unico(session, data.nombre)
    categoria = Categoria.model_validate(data)
    session.add(categoria)
    session.commit()
    session.refresh(categoria)
    return categoria


def actualizar(session: Session, categoria_id: int, data: CategoriaUpdate) -> Categoria:
    categoria = obtener(session, categoria_id)                          # 404
    _validar_nombre_unico(session, data.nombre, excluir_id=categoria_id)  # 409
    categoria.sqlmodel_update(data.model_dump())
    categoria.updated_at = utc_now()                                    # auditoría
    session.add(categoria)
    session.commit()
    session.refresh(categoria)
    return categoria


def eliminar(session: Session, categoria_id: int) -> None:
    """Borrado LÓGICO: la fila queda en la tabla, marcada con deleted_at."""
    categoria = obtener(session, categoria_id)          # 404
    _validar_sin_productos_activos(session, categoria_id)  # 409
    ahora = utc_now()
    categoria.deleted_at = ahora
    categoria.updated_at = ahora
    session.add(categoria)
    session.commit()