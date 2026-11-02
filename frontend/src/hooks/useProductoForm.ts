import { useForm } from "@tanstack/react-form";
import type { Producto, ProductoInput } from "../types/producto";

// Valores del FORMULARIO: no son idénticos a ProductoInput porque los inputs
// HTML trabajan con texto. Se convierten recién al enviar (aInput).
export type ProductoFormValues = {
  nombre: string;
  descripcion: string;
  precio_base: string; // texto del <input type="number">
  imagenes: string; // una URL por línea en el <textarea>
  disponible: boolean;
  categoria_ids: number[];
  principal_id: number | null; // null = todavía no se eligió
};

export const PRODUCTO_VACIO: ProductoFormValues = {
  nombre: "",
  descripcion: "",
  precio_base: "",
  imagenes: "",
  disponible: true,
  categoria_ids: [],
  principal_id: null,
};

export const productoAValores = (producto: Producto): ProductoFormValues => ({
  nombre: producto.nombre,
  descripcion: producto.descripcion,
  precio_base: String(producto.precio_base),
  imagenes: producto.imagenes_url.join("\n"),
  disponible: producto.disponible,
  categoria_ids: producto.categorias.map((c) => c.id),
  principal_id: producto.categoria_principal_id,
});

// La principal es la elegida con la estrella, si sigue marcada;
// si no, la primera marcada. Valor DERIVADO: no se guarda aparte.
export const calcularPrincipal = (
  categoriaIds: number[],
  principalId: number | null,
): number | null =>
  principalId !== null && categoriaIds.includes(principalId)
    ? principalId
    : (categoriaIds[0] ?? null);

// Convierte lo que hay en pantalla al formato que espera la API.
// La principal viaja PRIMERA en categoria_ids (así lo decidimos en el backend).
const aInput = (valores: ProductoFormValues): ProductoInput => {
  const principal = calcularPrincipal(valores.categoria_ids, valores.principal_id);
  const resto = valores.categoria_ids.filter((id) => id !== principal);
  return {
    nombre: valores.nombre.trim(),
    descripcion: valores.descripcion.trim(),
    precio_base: Number(valores.precio_base),
    imagenes_url: valores.imagenes
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url !== ""),
    disponible: valores.disponible,
    categoria_ids: principal !== null ? [principal, ...resto] : resto,
  };
};

export function useProductoForm(onGuardar: (data: ProductoInput) => void) {
  return useForm({
    defaultValues: PRODUCTO_VACIO,
    onSubmit: ({ value }) => onGuardar(aInput(value)),
  });
}

export type ProductoForm = ReturnType<typeof useProductoForm>;
