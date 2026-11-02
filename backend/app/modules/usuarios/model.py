from sqlmodel import Field, SQLModel


class Usuario(SQLModel, table=True):
    """Tabla 'usuario'.

    - hashed_password: hash bcrypt, NUNCA la contraseña en texto plano (RN-01).
    - username y email: únicos (RN-02). unique=True lo garantiza también la base.
    - role: "user" | "admin". Lo usa require_role() para autorizar (RBAC).
    - disabled: borrado lógico del usuario (RN-11). La cuenta no se elimina:
      se desactiva y se puede volver a activar.
    """

    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True, max_length=50)
    full_name: str = Field(max_length=150)
    email: str = Field(index=True, unique=True, max_length=255)
    hashed_password: str
    role: str = Field(default="user", max_length=20)
    disabled: bool = Field(default=False)
