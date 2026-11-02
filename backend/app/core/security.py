"""Utilidades de seguridad: hash de contraseñas (bcrypt) y tokens JWT.

Viven en core/ porque las usan varios lugares (el servicio de usuarios,
las dependencias de autenticación y el seed) y no dependen de ningún módulo.
"""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings


# ─────────────────────────────────────────────────────────────────────
# 1) CONTRASEÑAS (bcrypt) — RN-01
# ─────────────────────────────────────────────────────────────────────

# bcrypt: hash LENTO a propósito (factor de costo 12 por defecto) y con SAL
# aleatoria por cada contraseña. Así, si roban la base, adivinar cada
# contraseña cuesta horas y no sirven las tablas precalculadas (rainbow tables).
# deprecated="auto": si en el futuro se cambia de algoritmo, los hashes viejos
# se siguen pudiendo verificar.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    """Convierte la contraseña en texto plano en un hash bcrypt.

    El resultado ($2b$12$...) ya incluye adentro la versión, el costo y la sal:
    por eso no hace falta guardar la sal en otra columna.
    """
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Indica si la contraseña escrita coincide con el hash guardado.

    No "descifra" nada (un hash no se puede deshacer): saca la sal del hash,
    vuelve a calcular el hash de lo escrito y compara. La comparación es en
    tiempo constante, para evitar ataques de temporización.
    """
    return pwd_context.verify(plain, hashed)


# ─────────────────────────────────────────────────────────────────────
# 2) TOKENS JWT
# ─────────────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Crea un JWT firmado con la SECRET_KEY.

    data: los datos que identifican al usuario, p. ej. {"sub": "admin", "role": "admin"}.
    expires_delta: duración opcional; si no viene, se usa la del .env (30 min).
    """
    # Copia: así no se modifica el diccionario que recibimos de afuera.
    to_encode = data.copy()

    # Vencimiento en UTC: el servidor no depende de la zona horaria de la máquina.
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    # "exp": claim estándar; la librería rechaza el token cuando vence.
    # "type": claim propio, distingue este token de un eventual refresh token.
    to_encode.update({"type": "access", "exp": expire})

    # FIRMA, no cifrado: el contenido se puede leer (Base64url), pero si alguien
    # lo modifica (p. ej. cambia "user" por "admin"), la firma deja de coincidir.
    # Nunca se ponen contraseñas ni datos sensibles adentro.
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """Valida un JWT y devuelve sus datos, o None si no es válido.

    jwt.decode verifica la firma y el vencimiento. Cualquier problema
    (firma falsa, token vencido o mal formado) termina en None: quien llama
    solo pregunta "¿es válido?", sin manejar errores criptográficos.
    """
    try:
        # algorithms es una LISTA FIJA definida por el servidor: impide que un
        # token "diga" que usa otro algoritmo (o ninguno) para saltear la firma.
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None

    # Solo se aceptan tokens de acceso.
    if payload.get("type") != "access":
        return None

    return payload
