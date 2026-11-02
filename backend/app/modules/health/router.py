from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text

from app.core.database import SessionDep

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/")
def health():
    """¿El servidor está vivo? No toca la base."""
    return {"status": "ok"}


@router.get("/db")
def health_db(session: SessionDep):
    """¿La base responde? Ejecuta la consulta más barata posible."""
    try:
        session.exec(text("SELECT 1"))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="La base de datos no responde",
        )
    return {"status": "ok", "database": "ok"}