import type { Auditoria } from "./auditoria";

// Catálogo fijo del backend (GET /unidades-medida). Solo lectura.
export interface UnidadMedida {
  id: number;
  nombre: string;
  simbolo: string;
  tipo: string;
}

// Versión reducida que viene anidada dentro del ingrediente.
export type UnidadMedidaResumen = Pick<UnidadMedida, "id" | "simbolo">;

// Lo que DEVUELVE el backend (IngredienteRead).
export interface Ingrediente extends Auditoria {
  id: number;
  nombre: string;
  descripcion: string;
  unidad_medida_id: number;
  unidad_medida: UnidadMedidaResumen;
}

// Lo que ENVIAMOS al crear o editar (IngredienteCreate / IngredienteUpdate).
export type IngredienteInput = Pick<
  Ingrediente,
  "nombre" | "descripcion" | "unidad_medida_id"
>;
