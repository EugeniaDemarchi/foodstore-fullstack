import type { Auditoria } from "./auditoria";
import type { Categoria } from "./categoria";

// Versión reducida de una categoría, anidada dentro del producto (CategoriaResumen).
export type CategoriaResumen = Pick<Categoria, "id" | "nombre">;

// Lo que DEVUELVE el backend (ProductoRead).
export interface Producto extends Auditoria {
  id: number;
  nombre: string;
  descripcion: string;
  precio_base: number;
  imagenes_url: string[];
  disponible: boolean;
  categorias: CategoriaResumen[];
  categoria_principal_id: number | null;
}

// Lo que ENVIAMOS (ProductoCreate / ProductoUpdate).
// Entran ids (categoria_ids) y salen objetos (categorias): la misma asimetría que en el backend.
export type ProductoInput = Pick<
  Producto,
  "nombre" | "descripcion" | "precio_base" | "imagenes_url" | "disponible"
> & {
  categoria_ids: number[];
};

// Respuesta de GET /productos/{id}/categorias (CategoriaDeProducto).
export type CategoriaDeProducto = CategoriaResumen & {
  es_principal: boolean;
};
