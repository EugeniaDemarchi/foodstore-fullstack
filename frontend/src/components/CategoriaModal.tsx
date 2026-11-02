import type { CategoriaForm } from "../hooks/useCategoriaForm";
import { Button } from "./ui/Button";
import { claseInput, claseLabel, ErrorApi, ErroresCampo } from "./ui/campos";
import { Modal } from "./ui/Modal";

interface CategoriaModalProps {
  form: CategoriaForm; // la instancia de TanStack Form que creó la página
  idEdicion: number | null; // null = alta · número = edición
  error: string | null; // error del backend (409, 422...)
  guardando: boolean;
  onClose: () => void;
}

function CategoriaModal({ form, idEdicion, error, guardando, onClose }: CategoriaModalProps) {
  const esEdicion = idEdicion !== null;

  return (
    <Modal
      titulo={esEdicion ? "Editar categoría" : "Nueva categoría"}
      subtitulo={
        esEdicion
          ? `Modificando la categoría #${idEdicion}`
          : "Completá los datos para crear una categoría"
      }
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit(); // corre los validadores y, si pasan, onSubmit
        }}
        className="space-y-4"
        noValidate
      >
        {/* form.Field conecta el input con su valor y sus errores */}
        <form.Field
          name="nombre"
          validators={{
            // RN-01: obligatorio, sin aceptar solo espacios
            onChange: ({ value }) =>
              !value.trim() ? "El nombre es obligatorio" : undefined,
            onBlur: ({ value }) =>
              value.trim().length > 100 ? "Máximo 100 caracteres" : undefined,
          }}
        >
          {(field) => (
            <div>
              <label htmlFor={field.name} className={claseLabel}>
                Nombre de la categoría
              </label>
              <input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={field.state.meta.errors.length > 0}
                autoFocus
                className={claseInput}
              />
              <ErroresCampo errores={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <form.Field name="descripcion">
          {(field) => (
            <div>
              <label htmlFor={field.name} className={claseLabel}>
                Descripción <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <textarea
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                rows={3}
                className={claseInput}
              />
            </div>
          )}
        </form.Field>

        <ErrorApi mensaje={error} />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          {/* form.Subscribe: solo el botón se re-renderiza cuando cambia canSubmit */}
          <form.Subscribe selector={(state) => state.canSubmit}>
            {(canSubmit) => (
              <Button type="submit" disabled={!canSubmit || guardando}>
                {guardando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear categoría"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </Modal>
  );
}

export default CategoriaModal;
