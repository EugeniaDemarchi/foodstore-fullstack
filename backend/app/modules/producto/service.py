from fastapi import HTTPException, status
from sqlalchemy.orm import selectinload
from sqlmodel import Session, col, delete, select

from app.modules.categoria import service as categoria_service
from app.modules.categoria.model import Categoria
from app.core.audit import utc_now
from app.core.pagination import paginar
from app.modules.ingrediente.model import Ingrediente

from .model import Producto, ProductoCategoria, ProductoIngrediente
from .schema import (
    CategoriaDeProducto,
    IngredienteCantidad,
    IngredienteDeProducto,
    ProductoCreate,
    ProductoPaginatedResponse,
    ProductoUpdate,
)


# ---------- Lectura ----------

def _consulta_base():
    # selectinload trae las categorías (y los vínculos, con es_principal) de TODOS
    # los productos en una consulta extra cada uno, en vez de una por producto ("N+1").
    return (
        select(Producto)
        .options(selectinload(Producto.categorias), selectinload(Producto.vinculos))
        .order_by(Producto.id)
    )


def listar(
    session: Session,
    offset: int,
    limit: int,
    nombre: str | None = None,
    incluir_inactivos: bool = False,
) -> ProductoPaginatedResponse:
    consulta = _consulta_base()
    if not incluir_inactivos:
        consulta = consulta.where(col(Producto.deleted_at).is_(None))
    if nombre:
        consulta = consulta.where(col(Producto.nombre).ilike(f"%{nombre.strip()}%"))

    items, total = paginar(session, consulta, offset, limit)
    return ProductoPaginatedResponse(items=items, total=total, offset=offset, limit=limit)


def obtener(session: Session, producto_id: int) -> Producto:
    """Devuelve el producto ACTIVO con sus categorías, o 404 (RN-10)."""
    producto = session.exec(
        _consulta_base().where(
            Producto.id == producto_id,
            col(Producto.deleted_at).is_(None),
        )
    ).first()
    if producto is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto {producto_id} no encontrado",
        )
    return producto


# ---------- Relación N:M (solo consulta, RN-22) ----------

def listar_categorias(session: Session, producto_id: int) -> list[CategoriaDeProducto]:
    """GET /productos/{id}/categorias — la principal aparece primero."""
    obtener(session, producto_id)  # 404 si el producto no existe
    filas = session.exec(
        select(Categoria, ProductoCategoria.es_principal)
        .join(ProductoCategoria, ProductoCategoria.categoria_id == Categoria.id)
        .where(ProductoCategoria.producto_id == producto_id)
        .order_by(col(ProductoCategoria.es_principal).desc(), Categoria.id)
    ).all()
    return [
        CategoriaDeProducto(id=c.id, nombre=c.nombre, es_principal=principal)
        for c, principal in filas
    ]


def listar_ingredientes(session: Session, producto_id: int) -> list[IngredienteDeProducto]:
    """GET /productos/{id}/ingredientes — con cantidad y unidad."""
    obtener(session, producto_id)  # 404 si el producto no existe
    vinculos = session.exec(
        select(ProductoIngrediente)
        .where(ProductoIngrediente.producto_id == producto_id)
        .options(
            selectinload(ProductoIngrediente.ingrediente).selectinload(
                Ingrediente.unidad_medida
            )
        )
        .order_by(ProductoIngrediente.ingrediente_id)
    ).all()
    return [
        IngredienteDeProducto(
            id=v.ingrediente.id,
            nombre=v.ingrediente.nombre,
            cantidad=v.cantidad,
            unidad_medida=v.ingrediente.unidad_medida.simbolo,
        )
        for v in vinculos
    ]


def listar_por_categoria(session: Session, categoria_id: int) -> list[Producto]:
    """GET /categorias/{id}/productos — solo productos activos."""
    categoria_service.obtener(session, categoria_id)  # 404 si la categoría no existe
    consulta = (
        _consulta_base()
        .join(ProductoCategoria, ProductoCategoria.producto_id == Producto.id)
        .where(
            ProductoCategoria.categoria_id == categoria_id,
            col(Producto.deleted_at).is_(None),
        )
    )
    return list(session.exec(consulta).all())


# ---------- Reglas de negocio ----------

def _validar_categorias(session: Session, categoria_ids: list[int]) -> None:
    """RN-11: todas las categorías deben existir y estar activas; si no, 404."""
    encontradas = session.exec(
        select(Categoria.id).where(
            col(Categoria.id).in_(categoria_ids),
            col(Categoria.deleted_at).is_(None),
        )
    ).all()
    faltantes = sorted(set(categoria_ids) - set(encontradas))
    if faltantes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Categorías no encontradas: {faltantes}",
        )


def _reemplazar_categorias(session: Session, producto_id: int, categoria_ids: list[int]) -> None:
    """RN-12: borra TODOS los vínculos del producto y crea los nuevos.
    La primera categoría de la lista queda como principal."""
    session.exec(delete(ProductoCategoria).where(ProductoCategoria.producto_id == producto_id))
    for posicion, categoria_id in enumerate(categoria_ids):
        session.add(
            ProductoCategoria(
                producto_id=producto_id,
                categoria_id=categoria_id,
                es_principal=(posicion == 0),
            )
        )


def _validar_ingredientes(session: Session, items: list[IngredienteCantidad]) -> None:
    """Todos los ingredientes deben existir y estar activos; si no, 404."""
    if not items:
        return
    ids = [item.ingrediente_id for item in items]
    encontrados = session.exec(
        select(Ingrediente.id).where(
            col(Ingrediente.id).in_(ids),
            col(Ingrediente.deleted_at).is_(None),
        )
    ).all()
    faltantes = sorted(set(ids) - set(encontrados))
    if faltantes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ingredientes no encontrados: {faltantes}",
        )


def _reemplazar_ingredientes(
    session: Session, producto_id: int, items: list[IngredienteCantidad]
) -> None:
    """RN-21: borra TODOS los ingredientes del producto y carga los nuevos."""
    session.exec(delete(ProductoIngrediente).where(ProductoIngrediente.producto_id == producto_id))
    for item in items:
        session.add(
            ProductoIngrediente(
                producto_id=producto_id,
                ingrediente_id=item.ingrediente_id,
                cantidad=item.cantidad,
            )
        )


# ---------- Escritura ----------

def crear(session: Session, data: ProductoCreate) -> Producto:
    # Validar ANTES de escribir nada: si falla, el catálogo no cambia (RN-17).
    _validar_categorias(session, data.categoria_ids)
    _validar_ingredientes(session, data.ingredientes)

    producto = Producto.model_validate(
        data.model_dump(exclude={"categoria_ids", "ingredientes"})
    )
    session.add(producto)
    session.flush()  # manda el INSERT sin confirmar, para que la base asigne el id
    _reemplazar_categorias(session, producto.id, data.categoria_ids)
    _reemplazar_ingredientes(session, producto.id, data.ingredientes)
    session.commit()  # producto + vínculos se confirman JUNTOS (todo o nada)
    return obtener(session, producto.id)


def actualizar(session: Session, producto_id: int, data: ProductoUpdate) -> Producto:
    producto = obtener(session, producto_id)  # 404
    if data.categoria_ids is not None:
        _validar_categorias(session, data.categoria_ids)  # 404 antes de tocar nada
    if data.ingredientes is not None:
        _validar_ingredientes(session, data.ingredientes)  # 404 antes de tocar nada

    producto.sqlmodel_update(data.model_dump(exclude={"categoria_ids", "ingredientes"}))
    producto.updated_at = utc_now()
    session.add(producto)

    if data.categoria_ids is not None:  # si no vino, las categorías quedan igual
        _reemplazar_categorias(session, producto_id, data.categoria_ids)
    if data.ingredientes is not None:  # RN-21
        _reemplazar_ingredientes(session, producto_id, data.ingredientes)

    session.commit()
    return obtener(session, producto_id)


def eliminar(session: Session, producto_id: int) -> None:
    """Borrado LÓGICO. Los vínculos con categorías se conservan en la tabla,
    pero todas las consultas ignoran productos borrados: por eso el producto
    desaparece de /categorias/{id}/productos y deja de bloquear la RN-05."""
    producto = obtener(session, producto_id)  # 404
    ahora = utc_now()
    producto.deleted_at = ahora
    producto.updated_at = ahora
    session.add(producto)
    session.commit()