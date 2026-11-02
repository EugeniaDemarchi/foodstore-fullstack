import type { Categoria, CategoriaInput } from "../types/categoria";
import type { PaginatedResponse } from "../types/paginacion";
import { api } from "../api/axiosInstance";

const RUTA = "/categorias/";
// TanStack Table ordena y pagina EN EL NAVEGADOR: necesita todas las filas.
// 100 es el máximo que acepta el backend (LimitParam, le=100) -> params: { limit: 100 }.

export const categoriasService = {
  listar: async (signal?: AbortSignal): Promise<Categoria[]> => {
    const { data } = await api.get<PaginatedResponse<Categoria>>(RUTA, {
      params: { limit: 100 },
      signal,
    });
    return data.items; // la tabla solo necesita la lista
  },

  crear: (data: CategoriaInput) =>
    api.post<Categoria>(RUTA, data).then((r) => r.data),

  actualizar: (id: number, data: CategoriaInput) =>
    api.put<Categoria>(`${RUTA}${id}`, data).then((r) => r.data),

  eliminar: (id: number) => api.delete(`${RUTA}${id}`).then(() => undefined),
};
