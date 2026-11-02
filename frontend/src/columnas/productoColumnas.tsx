import { createColumnHelper } from "@tanstack/react-table";
import type { Producto } from "../types/producto";
import { formatearPrecio } from "../utils/formato";

const columna = createColumnHelper<Producto>();

export const productoColumnas = [
  columna.accessor("nombre", {
    header: "Producto",
    // cell puede devolver JSX: flexRender lo dibuja tal cual
    cell: (info) => (
      <>
        <p className="font-medium text-slate-800">{info.getValue()}</p>
        {info.row.original.descripcion && (
          <p className="mt-0.5 text-xs text-slate-500">{info.row.original.descripcion}</p>
        )}
      </>
    ),
  }),
  columna.accessor("precio_base", {
    header: "Precio",
    cell: (info) => (
      <span className="whitespace-nowrap tabular-nums">{formatearPrecio(info.getValue())}</span>
    ),
  }),
  columna.accessor("categorias", {
    header: "Categorías",
    enableSorting: false, // una lista no tiene un orden natural
    cell: (info) => {
      const { categoria_principal_id } = info.row.original;
      // La principal se muestra primero; el resto conserva su orden.
      const categorias = [...info.getValue()].sort(
        (a, b) =>
          Number(b.id === categoria_principal_id) - Number(a.id === categoria_principal_id),
      );
      return (
        <ul className="flex flex-wrap gap-1">
          {categorias.map((categoria) => (
            <li
              key={categoria.id}
              className={
                categoria.id === categoria_principal_id
                  ? "rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200"
                  : "rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
              }
            >
              {categoria.id === categoria_principal_id && "★ "}
              {categoria.nombre}
            </li>
          ))}
        </ul>
      );
    },
  }),
  columna.accessor("disponible", {
    header: "Estado",
    cell: (info) =>
      info.getValue() ? (
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-success">
          Disponible
        </span>
      ) : (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          No disponible
        </span>
      ),
  }),
];
