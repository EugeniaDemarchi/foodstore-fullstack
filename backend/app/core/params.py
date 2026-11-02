from typing import Annotated

from fastapi import Query

# Parámetros de listado compartidos (guía "Optimización de Endpoints"):
# ge / le protegen a la base de pedidos absurdos como limit=100000 u offset=-5 -> 422.
OffsetParam = Annotated[int, Query(ge=0, description="Cuántos registros saltear")]
LimitParam = Annotated[int, Query(ge=1, le=100, description="Máximo de registros por página")]
NombreParam = Annotated[str | None, Query(max_length=150, description="Búsqueda parcial por nombre")]
InactivosParam = Annotated[bool, Query(description="Incluir registros borrados lógicamente")]