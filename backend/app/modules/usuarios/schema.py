from pydantic import EmailStr, field_validator
from sqlmodel import Field, SQLModel

from app.core.validators import texto_obligatorio


# ---------- Entrada (lo que manda el cliente) ----------

class UserCreate(SQLModel):
    """Registro. Trae la contraseña en texto plano: el Service la convierte
    en hash y NUNCA se guarda ni se devuelve tal cual."""

    username: str = Field(min_length=3, max_length=50)
    full_name: str = Field(min_length=1, max_length=150)
    email: EmailStr                                   # email inválido -> 422 (RN-09)
    password: str = Field(min_length=8, max_length=72)  # menos de 8 -> 422 (RN-09)

    @field_validator("username", "full_name")
    @classmethod
    def sin_espacios_vacios(cls, valor: str) -> str:
        return texto_obligatorio(valor)

    @field_validator("password")
    @classmethod
    def maximo_72_bytes(cls, valor: str) -> str:
        # bcrypt solo procesa los primeros 72 BYTES. Una letra con tilde
        # ocupa 2 bytes en UTF-8, así que el límite real se mide en bytes.
        if len(valor.encode("utf-8")) > 72:
            raise ValueError("la contraseña no puede superar los 72 bytes")
        return valor


# ---------- Salida (lo que devuelve la API) ----------

class UserPublic(SQLModel):
    """Vista pública del usuario: NO tiene hashed_password.
    Con response_model=UserPublic, FastAPI filtra la respuesta y el hash
    nunca sale del servidor, aunque se devuelva el objeto completo."""

    id: int
    username: str
    full_name: str
    email: str
    role: str
    disabled: bool
