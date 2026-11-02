// Espejo de PaginatedResponse[T] del backend (app/core/pagination.py).
// <T> es el mismo "molde" que en Python: se completa al usarlo,
// p. ej. PaginatedResponse<Categoria>.
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

// Parámetros que aceptan los listados (?offset=&limit=&nombre=).
export type ListarParams = {
  offset?: number;
  limit?: number;
  nombre?: string;
};
