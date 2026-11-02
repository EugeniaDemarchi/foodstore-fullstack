import { useForm } from "@tanstack/react-form";
import type { Ingrediente, IngredienteInput } from "../types/ingrediente";

// Valores del FORMULARIO: la unidad arranca sin elegir (null),
// por eso no es exactamente IngredienteInput.
export type IngredienteFormValues = Omit<IngredienteInput, "unidad_medida_id"> & {
  unidad_medida_id: number | null;
};

export const INGREDIENTE_VACIO: IngredienteFormValues = {
  nombre: "",
  descripcion: "",
  unidad_medida_id: null,
};

export const ingredienteAValores = (ingrediente: Ingrediente): IngredienteFormValues => ({
  nombre: ingrediente.nombre,
  descripcion: ingrediente.descripcion,
  unidad_medida_id: ingrediente.unidad_medida_id,
});

export function useIngredienteForm(onGuardar: (data: IngredienteInput) => void) {
  return useForm({
    defaultValues: INGREDIENTE_VACIO,
    onSubmit: ({ value }) => {
      // El validador del campo ya garantizó que hay unidad elegida.
      if (value.unidad_medida_id === null) return;
      onGuardar({
        nombre: value.nombre.trim(),
        descripcion: value.descripcion.trim(),
        unidad_medida_id: value.unidad_medida_id,
      });
    },
  });
}

export type IngredienteForm = ReturnType<typeof useIngredienteForm>;
