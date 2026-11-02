"""Carga inicial: tablas CATÁLOGO (datos fijos del sistema) y usuarios de prueba.

- Se ejecuta sola al arrancar el servidor (lifespan en main.py).
- También se puede correr a mano:  .venv\\Scripts\\python.exe -m app.seed
- Es IDEMPOTENTE: si una fila ya existe, no la duplica ni la pisa.
"""

from sqlmodel import Session

from sqlmodel import select

from app.core.database import create_db_and_tables, engine
from app.core.security import hash_password
from app.modules.unidad_medida.model import UnidadMedida
from app.modules.usuarios.model import Usuario

UNIDADES_MEDIDA = [
    {"id": 1, "nombre": "kilogramo", "simbolo": "kg", "tipo": "masa"},
    {"id": 2, "nombre": "gramo", "simbolo": "g", "tipo": "masa"},
    {"id": 3, "nombre": "litro", "simbolo": "L", "tipo": "volumen"},
    {"id": 4, "nombre": "mililitro", "simbolo": "mL", "tipo": "volumen"},
    {"id": 5, "nombre": "pieza", "simbolo": "u", "tipo": "unidad"},
    {"id": 6, "nombre": "docena", "simbolo": "doc", "tipo": "unidad"},
    {"id": 7, "nombre": "metro cuadrado", "simbolo": "m²", "tipo": "area"},
]


def seed_unidades_medida(session: Session) -> int:
    """Inserta las unidades que falten. Devuelve cuántas agregó."""
    agregadas = 0
    for datos in UNIDADES_MEDIDA:
        if session.get(UnidadMedida, datos["id"]) is None:
            session.add(UnidadMedida(**datos))
            agregadas += 1
    session.commit()
    return agregadas


# Usuarios iniciales para probar (TP 9). El registro público SIEMPRE crea
# rol "user" (RN-08): el seed es la única forma de tener un admin.
# Las contraseñas se guardan con hash, igual que en el registro (RN-01).
USUARIOS_INICIALES = [
    {"username": "admin", "full_name": "Administrador del Sistema",
     "email": "admin@foodstore.com", "password": "Admin1234!", "role": "admin"},
    {"username": "juan", "full_name": "Juan Pérez",
     "email": "juan@foodstore.com", "password": "Juan1234!", "role": "user"},
]


def seed_usuarios(session: Session) -> int:
    """Crea los usuarios que falten (busca por username). Devuelve cuántos agregó."""
    agregados = 0
    for datos in USUARIOS_INICIALES:
        existe = session.exec(select(Usuario).where(Usuario.username == datos["username"])).first()
        if existe is None:
            session.add(Usuario(
                username=datos["username"],
                full_name=datos["full_name"],
                email=datos["email"],
                hashed_password=hash_password(datos["password"]),
                role=datos["role"],
            ))
            agregados += 1
    session.commit()
    return agregados


def run_seed() -> None:
    with Session(engine) as session:
        seed_unidades_medida(session)
        seed_usuarios(session)


if __name__ == "__main__":
    create_db_and_tables()
    with Session(engine) as session:
        print(f"Unidades de medida agregadas: {seed_unidades_medida(session)}")
        print(f"Usuarios agregados: {seed_usuarios(session)}")
        print("  admin / Admin1234!  -> rol admin")
        print("  juan  / Juan1234!   -> rol user")
