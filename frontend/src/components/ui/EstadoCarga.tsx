interface EstadoCargaProps {
  filas?: number;
}

// Skeleton: anticipa la forma de la tabla mientras llegan los datos.
export function EstadoCarga({ filas = 5 }: EstadoCargaProps) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="h-11 animate-pulse rounded-md bg-slate-200" />
      ))}
    </div>
  );
}
