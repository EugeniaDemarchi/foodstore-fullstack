import { createColumnHelper } from "@tanstack/react-table";
import type { Categoria } from "../types/categoria";

// createColumnHelper<Categoria>: accessor() solo acepta claves que EXISTEN en
// Categoria, y getValue() queda tipado según la propiedad.
const columna = createColumnHelper<Categoria>();

// Se definen FUERA de cualquier componente: conservan la misma referencia
// entre renders (si se recrearan en cada render, la tabla se reprocesaría).
export const categoriaColumnas = [
  columna.accessor("id", { header: "N.º" }),
  columna.accessor("nombre", { header: "Nombre" }),
  columna.accessor("descripcion", {
    header: "Descripción",
    cell: (info) => info.getValue() || "—",
  }),
];
