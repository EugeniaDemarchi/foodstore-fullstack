"""Dependencias de autenticación y autorización (se inyectan con Depends).

Cadena que se ejecuta ANTES de cada endpoint protegido:

    oauth2_scheme            -> saca el token de la cookie        (sin cookie: 401)
        ↓
    get_current_user         -> valida el JWT y busca al usuario  (inválido/vencido: 401)
        ↓
    get_current_active_user  -> verifica que la cuenta esté activa (desactivada: 400)
        ↓
    require_role([...])      -> verifica el rol                    (rol no permitido: 403)

401 = no sé quién sos.  403 = sé quién sos, pero no podés.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer

from app.core.database import session_factory
from app.core.security import decode_access_token
from app.modules.usuarios.schema import UserPublic
from app.modules.usuarios.service import UsuarioService
from app.modules.usuarios.unit_of_work import UsuarioUnitOfWork


# ---------- 1) Leer el token de la cookie ----------

class OAuth2PasswordBearerWithCookie(OAuth2PasswordBearer):
    """OAuth2PasswordBearer (el estándar de FastAPI) busca el token en el
    encabezado Authorization. Esta versión lo busca SOLO en la cookie HttpOnly
    access_token (RN-03): el encabezado no se acepta, porque para mandarlo
    el frontend tendría que poder leer el token, y la cookie existe justamente
    para que JavaScript no lo toque."""

    async def __call__(self, request: Request) -> str | None:
        token = request.cookies.get("access_token")
        if not token:
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="No autenticado",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            return None
        return token


# tokenUrl: la ruta del login; FastAPI la muestra en la documentación (/docs).
oauth2_scheme = OAuth2PasswordBearerWithCookie(tokenUrl="/api/v1/auth/token")


def get_usuario_service() -> UsuarioService:
    """Arma el Service con su Unit of Work (mismo patrón que pedidos)."""
    return UsuarioService(UsuarioUnitOfWork(session_factory))


UsuarioServiceDep = Annotated[UsuarioService, Depends(get_usuario_service)]


# ---------- 2) ¿Quién es? (autenticación) — RN-10 ----------

def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    service: UsuarioServiceDep,
) -> UserPublic:
    credenciales_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas o token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)  # firma + vencimiento + type
    if payload is None:
        raise credenciales_invalidas

    username = payload.get("sub")
    if username is None:
        raise credenciales_invalidas

    # Se busca en la BASE en cada pedido: si el usuario fue borrado o
    # desactivado después de emitir el token, nos enteramos ahora.
    usuario = service.obtener_por_username(username)
    if usuario is None:
        raise credenciales_invalidas
    return usuario


# ---------- 3) ¿Está activo? ----------

def get_current_active_user(
    current_user: Annotated[UserPublic, Depends(get_current_user)],
) -> UserPublic:
    """Validar la firma no alcanza: la cuenta pudo desactivarse después de
    emitir el token. El estado se consulta en la base en cada pedido."""
    if current_user.disabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cuenta de usuario desactivada",
        )
    return current_user


# Atajo para "cualquier usuario logueado y activo".
CurrentUser = Annotated[UserPublic, Depends(get_current_active_user)]


# ---------- 4) ¿Qué puede hacer? (autorización, RBAC) — RN-04 ----------

def require_role(allowed_roles: list[str]):
    """FÁBRICA de dependencias: recibe los roles permitidos y DEVUELVE una
    dependencia que responde 403 si el rol del usuario no está en la lista.

    Uso:  dependencies=[Depends(require_role(["admin"]))]
    """

    def role_checker(current_user: CurrentUser) -> UserPublic:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Permisos insuficientes. Rol actual: '{current_user.role}'. "
                    f"Se requiere uno de: {allowed_roles}"
                ),
            )
        return current_user

    return role_checker


# ---------- Atajos para declarar la seguridad en los routers ----------
# Se usan en el parámetro `dependencies=` de APIRouter o de cada endpoint.
# Así cada ruta "declara" qué exige, sin repetir la lógica.

SESION = [Depends(get_current_active_user)]                  # cualquier usuario logueado y activo
SOLO_ADMIN = [Depends(require_role(["admin"]))]               # escrituras del catálogo (RN-04)
USER_O_ADMIN = [Depends(require_role(["user", "admin"]))]     # crear pedidos (RN-05)
