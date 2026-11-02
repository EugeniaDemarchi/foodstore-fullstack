import type { Ingrediente, IngredienteInput, UnidadMedida } from "../types/ingrediente";
import type { PaginatedResponse } from "../types/paginacion";
import { api } from "../api/axiosInstance";

const RUTA = "/ingredientes/";

export const ingredientesService = {
  // Igual que en categorías: todas las filas (máx. 100), la tabla pagina.
  listar: async (signal?: AbortSignal): Promise<Ingrediente[]> => {
    const { data } = await api.get<PaginatedResponse<Ingrediente>>(RUTA, {
      params: { limit: 100 },
      signal,
    });
    return data.items;
  },

  crear: (data: IngredienteInput) =>
    api.post<Ingrediente>(RUTA, data).then((r) => r.data),

  actualizar: (id: number, data: IngredienteInput) =>
    api.put<Ingrediente>(`${RUTA}${id}`, data).then((r) => r.data),

  eliminar: (id: number) => api.delete(`${RUTA}${id}`).then(() => undefined),
};

export const unidadesMedidaService = {
  // El catálogo de unidades no se pagina: devuelve { items, total }.
  listar: async (signal?: AbortSignal): Promise<UnidadMedida[]> => {
    const { data } = await api.get<{ items: UnidadMedida[] }>("/unidades-medida/", { signal });
    return data.items;
  },
};
