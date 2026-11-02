import { createColumnHelper } from "@tanstack/react-table";
import type { Ingrediente } from "../types/ingrediente";

const columna = createColumnHelper<Ingrediente>();

export const ingredienteColumnas = [
  columna.accessor("id", { header: "N.º" }),
  columna.accessor("nombre", { header: "Nombre" }),
  columna.accessor("descripcion", {
    header: "Descripción",
    cell: (info) => info.getValue() || "—",
  }),
  // Dato ANIDADO: el id de la columna se indica a mano porque no es una clave directa.
  columna.accessor((ingrediente) => ingrediente.unidad_medida.simbolo, {
    id: "unidad",
    header: "Unidad",
  }),
];
