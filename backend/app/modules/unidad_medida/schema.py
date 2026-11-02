from sqlmodel import SQLModel


class UnidadMedidaRead(SQLModel):
    id: int
    nombre: str
    simbolo: str
    tipo: str


class UnidadMedidaListResponse(SQLModel):
    """Respuesta del catálogo: es chico y fijo, así que no se pagina."""

    items: list[UnidadMedidaRead]
    total: int
