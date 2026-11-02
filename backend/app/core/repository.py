from typing import Generic, TypeVar

from sqlmodel import Session, SQLModel, select

# ModelT = "cualquier modelo de tabla". Lo concreto (Pedido, DetallePedido...)
# lo decide cada repositorio hijo.
ModelT = TypeVar("ModelT", bound=SQLModel)


class BaseRepository(Generic[ModelT]):
    """CRUD genérico que heredan los repositorios de cada módulo.

    Regla de oro: un repositorio NUNCA llama a commit() ni a rollback().
    Solo prepara cambios dentro de la transacción; confirmarlos es
    trabajo exclusivo del Unit of Work.
    """

    model: type[ModelT]  # cada hijo indica con qué tabla trabaja

    def __init__(self, session: Session):
        self.session = session

    def get_by_id(self, id_: int) -> ModelT | None:
        return self.session.get(self.model, id_)

    def get_all(self) -> list[ModelT]:
        return list(self.session.exec(select(self.model)).all())

    def create(self, entidad: ModelT) -> ModelT:
        self.session.add(entidad)
        # flush() manda el INSERT a la base SIN confirmarlo.
        # Así la entidad ya tiene id y se puede usar en el paso siguiente
        # (p. ej. pedido.id para los detalles). Si después algo falla,
        # el rollback del Unit of Work descarta este INSERT igual.
        self.session.flush()
        return entidad

    def update(self, entidad: ModelT) -> ModelT:
        self.session.add(entidad)
        self.session.flush()
        return entidad