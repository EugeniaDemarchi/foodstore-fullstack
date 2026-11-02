import { flexRender, type Table } from "@tanstack/react-table";
import { Button } from "./Button";

interface TablaDatosProps<T> {
  table: Table<T>; // la instancia que creó la página con useReactTable
  // Opcionales (TP 9): si no llegan, la columna "Acciones" no se dibuja.
  // Las páginas solo las pasan cuando el usuario es admin.
  onEdit?: (fila: T) => void;
  onDelete?: (fila: T) => void;
}

// Componente de PRESENTACIÓN genérico (<T>): no sabe si muestra categorías,
// productos o ingredientes. Recibe la tabla ya armada (columnas, orden,
// paginación) y solo la dibuja con HTML + Tailwind.
export function TablaDatos<T>({ table, onEdit, onDelete }: TablaDatosProps<T>) {
  const { pageIndex } = table.getState().pagination;
  const conAcciones = Boolean(onEdit || onDelete);

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 font-medium">
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      // Clic en el encabezado: ascendente -> descendente -> sin orden
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1 uppercase hover:text-slate-800"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <span aria-hidden="true" className="w-3 text-brand">
                          {{ asc: "▲", desc: "▼" }[header.column.getIsSorted() as string] ?? ""}
                        </span>
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </th>
                ))}
                {conAcciones && <th className="px-4 py-3 text-right font-medium">Acciones</th>}
              </tr>
            ))}
          </thead>
          <tbody>
            {/* getRowModel() ya devuelve las filas ORDENADAS y PAGINADAS */}
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100 align-top hover:bg-slate-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-slate-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
                {conAcciones && (
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(row.original)}
                        className="font-medium text-brand hover:text-brand-hover"
                      >
                        Editar
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(row.original)}
                        className="ml-4 font-medium text-error hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav
        aria-label="Paginación"
        className="mt-4 flex items-center justify-between text-sm text-slate-600"
      >
        <span>
          Página {pageIndex + 1} de {Math.max(table.getPageCount(), 1)} ·{" "}
          {table.getRowCount()} en total
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            ← Anterior
          </Button>
          <Button
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente →
          </Button>
        </div>
      </nav>
    </div>
  );
}
