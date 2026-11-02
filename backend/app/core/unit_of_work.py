from collections.abc import Callable
from types import TracebackType

from sqlmodel import Session


class UnitOfWork:
    """Unit of Work base: fija en UN solo lugar dónde empieza y dónde
    termina la transacción.

    Se usa como context manager:

        with uow:
            ...  # todo lo de adentro es UNA transacción

    - Entrar al with  -> abre una sesión nueva y crea los repositorios.
    - Salir sin error -> commit (se guarda todo).
    - Salir con error -> rollback (no se guarda nada) y el error sigue
                         su camino hasta el Router.
    """

    def __init__(self, session_factory: Callable[[], Session]):
        # No recibe una sesión: recibe la FÁBRICA de sesiones.
        # Así cada "with" arranca con una sesión limpia.
        self.session_factory = session_factory

    def __enter__(self):
        self.session = self.session_factory()
        self._crear_repositorios()
        return self

    def _crear_repositorios(self) -> None:
        """Cada módulo lo redefine para colgar SUS repositorios de self,
        todos compartiendo la misma self.session (= misma transacción)."""

    def __exit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> None:
        try:
            if exc_type:
                self.session.rollback()
            else:
                self.session.commit()
        finally:
            # Se cierra SIEMPRE, aunque el commit falle.
            self.session.close()
        # No devolvemos True: la excepción (si hubo) se vuelve a lanzar
        # y llega al Router, que la traduce a 404 / 422.