// Piezas compartidas por los formularios de los tres modales.

export const claseInput =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none aria-[invalid=true]:border-error";

export const claseLabel = "mb-1 block text-sm font-medium text-slate-700";

interface ErroresCampoProps {
  errores: unknown[]; // field.state.meta.errors
}

// Muestra los errores de validación de un campo de TanStack Form.
export function ErroresCampo({ errores }: ErroresCampoProps) {
  if (errores.length === 0) return null;
  return (
    <>
      {errores.map((error) => (
        <p key={String(error)} className="mt-1 text-xs text-error">
          {String(error)}
        </p>
      ))}
    </>
  );
}

interface ErrorApiProps {
  mensaje: string | null;
}

// Error que devolvió el backend (409, 422...). El modal NO se cierra.
export function ErrorApi({ mensaje }: ErrorApiProps) {
  if (!mensaje) return null;
  return (
    <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-error">
      {mensaje}
    </p>
  );
}
