from app.core.security import create_access_token, hash_password, verify_password

from .model import Usuario
from .schema import UserCreate, UserPublic
from .unit_of_work import UsuarioUnitOfWork


# ---------- Errores de negocio ----------
# Igual que en pedidos: el Service no sabe de HTTP. Lanza estos errores
# y el Router decide qué código corresponde a cada uno.

class UsuarioYaExiste(Exception):
    """RN-02: username o email repetidos -> 409."""


class CredencialesInvalidas(Exception):
    """Usuario inexistente o contraseña incorrecta -> 401.
    Un solo error para los dos casos: la respuesta no revela cuál falló."""


class CuentaDesactivada(Exception):
    """Usuario con disabled=True -> 400."""


class UsuarioNoEncontrado(Exception):
    def __init__(self, user_id: int):
        super().__init__(f"Usuario {user_id} no encontrado")


class UsuarioService:
    def __init__(self, uow: UsuarioUnitOfWork):
        self.uow = uow

    # ---------- Autenticación ----------

    def registrar(self, data: UserCreate) -> UserPublic:
        """HU-01 / RN-08: el registro es público y SIEMPRE asigna rol 'user'.
        Aunque alguien mande "role": "admin" en el JSON, UserCreate no tiene
        ese campo y se ignora."""
        with self.uow as uow:
            if uow.usuarios.get_by_username(data.username):
                raise UsuarioYaExiste("El nombre de usuario ya está en uso")
            if uow.usuarios.get_by_email(data.email):
                raise UsuarioYaExiste("El email ya está registrado")

            usuario = Usuario(
                username=data.username,
                full_name=data.full_name,
                email=data.email,
                hashed_password=hash_password(data.password),  # RN-01
                role="user",
            )
            return UserPublic.model_validate(uow.usuarios.create(usuario))

    def autenticar(self, username: str, password: str) -> str:
        """HU-02: valida credenciales y devuelve el JWT firmado."""
        with self.uow as uow:
            usuario = uow.usuarios.get_by_username(username)
            if usuario is None or not verify_password(password, usuario.hashed_password):
                raise CredencialesInvalidas()
            if usuario.disabled:
                raise CuentaDesactivada()

            # "sub" (subject) = a quién representa el token. El rol viaja en el
            # token, pero la autorización se decide con el rol leído de la base.
            return create_access_token({"sub": usuario.username, "role": usuario.role})

    def obtener_por_username(self, username: str) -> UserPublic | None:
        """Lo usa core/deps.py para saber quién es el dueño de un token."""
        with self.uow as uow:
            usuario = uow.usuarios.get_by_username(username)
            return UserPublic.model_validate(usuario) if usuario else None

    # ---------- Administración (solo admin) ----------

    def listar(self) -> list[UserPublic]:
        with self.uow as uow:
            return [UserPublic.model_validate(u) for u in uow.usuarios.listar()]

    def cambiar_estado(self, user_id: int, disabled: bool) -> UserPublic:
        """Activar / desactivar = borrado lógico del usuario (RN-11)."""
        with self.uow as uow:
            usuario = uow.usuarios.get_by_id(user_id)
            if usuario is None:
                raise UsuarioNoEncontrado(user_id)
            usuario.disabled = disabled
            return UserPublic.model_validate(uow.usuarios.update(usuario))
