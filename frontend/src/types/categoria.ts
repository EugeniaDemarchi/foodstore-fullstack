import type { Auditoria } from "./auditoria";

// Lo que DEVUELVE el backend (CategoriaRead).
export interface Categoria extends Auditoria {
  id: number;
  nombre: string;
  descripcion: string;
}

// Lo que ENVIAMOS al crear o editar (CategoriaCreate / CategoriaUpdate).
// Pick elige solo los campos que el cliente puede mandar: nunca id ni fechas.
export type CategoriaInput = Pick<Categoria, "nombre" | "descripcion">;
