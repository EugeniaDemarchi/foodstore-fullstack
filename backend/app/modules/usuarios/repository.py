from sqlmodel import col, select

from app.core.repository import BaseRepository

from .model import Usuario


class UsuarioRepository(BaseRepository[Usuario]):
    model = Usuario

    # Además del CRUD heredado (get_by_id, get_all, create, update),
    # las búsquedas propias del dominio de usuarios:

    def get_by_username(self, username: str) -> Usuario | None:
        return self.session.exec(select(Usuario).where(Usuario.username == username)).first()

    def get_by_email(self, email: str) -> Usuario | None:
        return self.session.exec(select(Usuario).where(Usuario.email == email)).first()

    def listar(self) -> list[Usuario]:
        return list(self.session.exec(select(Usuario).order_by(col(Usuario.id))).all())
