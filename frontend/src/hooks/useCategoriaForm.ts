import { useForm } from "@tanstack/react-form";
import type { Categoria, CategoriaInput } from "../types/categoria";

export const CATEGORIA_VACIA: CategoriaInput = { nombre: "", descripcion: "" };

// Convierte una categoría existente en los valores del formulario (modo edición).
export const categoriaAValores = (categoria: Categoria): CategoriaInput => ({
  nombre: categoria.nombre,
  descripcion: categoria.descripcion,
});

// Envuelve useForm de TanStack Form. El TIPO de todo el formulario se
// infiere de defaultValues: TypeScript sabe que hay "nombre" y "descripcion".
export function useCategoriaForm(onGuardar: (data: CategoriaInput) => void) {
  return useForm({
    defaultValues: CATEGORIA_VACIA,
    // Solo se ejecuta si TODOS los validadores pasaron.
    onSubmit: ({ value }) =>
      onGuardar({
        nombre: value.nombre.trim(),
        descripcion: value.descripcion.trim(),
      }),
  });
}

// El tipo de la instancia del formulario, para tipar la prop del modal.
export type CategoriaForm = ReturnType<typeof useCategoriaForm>;
