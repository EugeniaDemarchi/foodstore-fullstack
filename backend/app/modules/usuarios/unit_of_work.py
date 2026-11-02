from app.core.unit_of_work import UnitOfWork

from .repository import UsuarioRepository


class UsuarioUnitOfWork(UnitOfWork):
    """UoW del módulo usuarios: hereda commit/rollback del UoW base
    y expone el repositorio de usuarios."""

    def _crear_repositorios(self) -> None:
        self.usuarios = UsuarioRepository(self.session)
