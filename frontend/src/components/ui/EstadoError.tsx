import { Button } from "./Button";

interface EstadoErrorProps {
  mensaje: string;
  detalle?: string;
  onReintentar?: () => void;
}

export function EstadoError({ mensaje, detalle, onReintentar }: EstadoErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-error/30 bg-red-50 px-4 py-3 text-sm text-error"
    >
      <div>
        <p className="font-medium">{mensaje}</p>
        {detalle && <p className="mt-0.5 text-red-700/80">{detalle}</p>}
      </div>
      {onReintentar && (
        <Button variant="outline" onClick={onReintentar}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
