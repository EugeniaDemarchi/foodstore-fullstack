from typing import Annotated
from app.core.config import settings
from fastapi import Depends
from sqlalchemy import event
from sqlmodel import SQLModel, Session, create_engine

# La URL viene de core/config.py, que la lee del archivo .env
DATABASE_URL = settings.database_url

# 1) SQLite, por defecto, solo deja usar una conexión desde el hilo que la creó.
#    FastAPI atiende requests en hilos distintos, así que hay que desactivar ese chequeo.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


# 2) SQLite trae las claves foráneas APAGADAS por defecto.
#    Sin esto, el ON DELETE CASCADE de la tabla ProductoCategoria (Etapa 3)
#    no funcionaría, y quedarían vínculos huérfanos.
@event.listens_for(engine, "connect")
def activar_foreign_keys(dbapi_connection, connection_record):
    if DATABASE_URL.startswith("sqlite"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session


def session_factory() -> Session:
    """Fábrica de sesiones para el Unit of Work: cada llamada, una sesión nueva."""
    return Session(engine)

SessionDep = Annotated[Session, Depends(get_session)]