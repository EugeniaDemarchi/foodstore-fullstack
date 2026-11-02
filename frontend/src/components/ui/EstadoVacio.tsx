import type { ReactNode } from "react";

interface EstadoVacioProps {
  titulo: string;
  children?: ReactNode; // texto o acción sugerida
}

export function EstadoVacio({ titulo, children }: EstadoVacioProps) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
      <p className="font-medium text-slate-700">{titulo}</p>
      {children && <div className="mt-1 text-sm text-slate-500">{children}</div>}
    </div>
  );
}
