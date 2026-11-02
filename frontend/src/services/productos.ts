import type { PaginatedResponse } from "../types/paginacion";
import type { Producto, ProductoInput } from "../types/producto";
import { api } from "../api/axiosInstance";

const RUTA = "/productos/";

export const productosService = {
  // Todas las filas (máx. 100): TanStack Table ordena y pagina en el navegador.
  listar: async (signal?: AbortSignal): Promise<Producto[]> => {
    const { data } = await api.get<PaginatedResponse<Producto>>(RUTA, {
      params: { limit: 100 },
      signal,
    });
    return data.items;
  },

  crear: (data: ProductoInput) =>
    api.post<Producto>(RUTA, data).then((r) => r.data),

  actualizar: (id: number, data: ProductoInput) =>
    api.put<Producto>(`${RUTA}${id}`, data).then((r) => r.data),

  eliminar: (id: number) => api.delete(`${RUTA}${id}`).then(() => undefined),
};
