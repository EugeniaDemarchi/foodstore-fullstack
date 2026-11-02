import { useEffect, type ReactNode } from "react";

interface ModalProps {
  titulo: string;
  subtitulo?: string;
  onClose: () => void;
  children: ReactNode;
}

// Solo la "cáscara" visual: fondo oscuro, caja centrada y título.
// Que esté abierto o cerrado lo decide la página con useState.
export function Modal({ titulo, subtitulo, onClose, children }: ModalProps) {
  // Escape cierra el modal (efecto secundario: escuchar el teclado).
  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-titulo" className="text-xl font-semibold text-slate-900">
          {titulo}
        </h2>
        {subtitulo && <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
