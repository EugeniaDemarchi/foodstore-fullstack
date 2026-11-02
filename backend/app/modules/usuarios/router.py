from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.deps import CurrentUser, UsuarioServiceDep, require_role

from .schema import UserCreate, UserPublic
from .service import CredencialesInvalidas, CuentaDesactivada, UsuarioNoEncontrado, UsuarioYaExiste

router = APIRouter(prefix="/api/v1/auth", tags=["Autenticación"])

COOKIE = "access_token"
# Solo admin: se reutiliza en las tres rutas de administración.
SoloAdmin = Annotated[UserPublic, Depends(require_role(["admin"]))]


# ---------- Públicas ----------

@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, service: UsuarioServiceDep):
    """HU-01: registro público. Siempre crea un usuario con rol 'user'."""
    try:
        return service.registrar(data)
    except UsuarioYaExiste as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error))


@router.post("/token")
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    service: UsuarioServiceDep,
    response: Response,
):
    """HU-02: OAuth2 Password Flow. Recibe username y password como
    FORMULARIO (no JSON) y entrega el JWT en una cookie HttpOnly (RN-03)."""
    try:
        token = service.autenticar(form_data.username, form_data.password)
    except CredencialesInvalidas:
        # Mismo mensaje para usuario inexistente y contraseña incorrecta.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except CuentaDesactivada:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cuenta de usuario desactivada")

    response.set_cookie(
        key=COOKIE,
        value=token,
        httponly=True,                                      # JavaScript no la puede leer
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # vence junto con el JWT
        samesite="lax",                                     # mitiga CSRF
        secure=False,                                       # en producción (HTTPS): True
    )
    # El token NO va en el cuerpo: solo en la cookie.
    return {"mensaje": "Login exitoso. Sesión iniciada."}


@router.post("/logout")
def logout(response: Response):
    """HU-03: responde con un Set-Cookie que borra la cookie del navegador.
    El JWT no se revoca: una copia seguiría valiendo hasta que venza (30 min)."""
    response.delete_cookie(key=COOKIE, httponly=True, samesite="lax", secure=False)
    return {"mensaje": "Sesión cerrada"}


# ---------- Con sesión ----------

@router.get("/me", response_model=UserPublic)
def me(current_user: CurrentUser):
    """HU-04: devuelve el usuario dueño de la cookie. El frontend lo usa
    al iniciar la app para confirmar si la sesión sigue viva."""
    return current_user


# ---------- Solo admin ----------

@router.get("/admin/usuarios", response_model=list[UserPublic])
def listar_usuarios(_admin: SoloAdmin, service: UsuarioServiceDep):
    return service.listar()


@router.post("/admin/usuarios/{user_id}/desactivar", response_model=UserPublic)
def desactivar_usuario(user_id: int, _admin: SoloAdmin, service: UsuarioServiceDep):
    try:
        return service.cambiar_estado(user_id, disabled=True)
    except UsuarioNoEncontrado as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))


@router.post("/admin/usuarios/{user_id}/activar", response_model=UserPublic)
def activar_usuario(user_id: int, _admin: SoloAdmin, service: UsuarioServiceDep):
    try:
        return service.cambiar_estado(user_id, disabled=False)
    except UsuarioNoEncontrado as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error))
