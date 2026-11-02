from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.modules.categoria.router import router as categoria_router
from app.core.config import settings
from app.core.database import create_db_and_tables
from app.modules.health.router import router as health_router
from app.modules.ingrediente.router import router as ingrediente_router
from app.modules.producto.router import router as producto_router
from app.seed import run_seed
from app.modules.unidad_medida.router import router as unidad_medida_router
from app.modules.pedido.router import router as pedido_router
from app.modules.usuarios.router import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Se ejecuta UNA vez al arrancar: crea las tablas que todavía no existen.
    create_db_and_tables()
    run_seed()  # carga unidades de medida y los usuarios iniciales si faltan
    yield


app = FastAPI(
    title="API Food Store - TP Unidad 9 (seguridad)",
    version="4.0.0",
    lifespan=lifespan,
)

# CORS: el navegador solo deja que el frontend (otro puerto = otro origen)
# llame a esta API si el backend lo autoriza explícitamente.
#
# TP 9 — allow_credentials=True: sin esto, el navegador no guarda ni envía
# la cookie HttpOnly con el token entre orígenes distintos (5173 -> 8000).
# Con credenciales NO se admite el comodín "*" en allow_origins: el origen
# del frontend se declara explícitamente (viene del .env).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],   # http://localhost:5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(categoria_router)
app.include_router(producto_router)
app.include_router(ingrediente_router)
app.include_router(unidad_medida_router)
app.include_router(pedido_router)