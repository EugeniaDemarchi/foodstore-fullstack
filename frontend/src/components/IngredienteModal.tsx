import type { IngredienteForm } from "../hooks/useIngredienteForm";
import type { UnidadMedida } from "../types/ingrediente";
import { Button } from "./ui/Button";
import { claseInput, claseLabel, ErrorApi, ErroresCampo } from "./ui/campos";
import { Modal } from "./ui/Modal";

interface IngredienteModalProps {
  form: IngredienteForm;
  unidades: UnidadMedida[]; // opciones del <select>
  idEdicion: number | null;
  error: string | null;
  guardando: boolean;
  onClose: () => void;
}

function IngredienteModal({
  form,
  unidades,
  idEdicion,
  error,
  guardando,
  onClose,
}: IngredienteModalProps) {
  const esEdicion = idEdicion !== null;

  return (
    <Modal
      titulo={esEdicion ? "Editar ingrediente" : "Nuevo ingrediente"}
      subtitulo={
        esEdicion
          ? `Modificando el ingrediente #${idEdicion}`
          : "Completá los datos para crear un ingrediente"
      }
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-4"
        noValidate
      >
        <form.Field
          name="nombre"
          validators={{
            // RN-10: obligatorio, sin aceptar solo espacios
            onChange: ({ value }) =>
              !value.trim() ? "El nombre es obligatorio" : undefined,
            onBlur: ({ value }) =>
              value.trim().length > 100 ? "Máximo 100 caracteres" : undefined,
          }}
        >
          {(field) => (
            <div>
              <label htmlFor={field.name} className={claseLabel}>
                Nombre del ingrediente
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

        <form.Field
          name="unidad_medida_id"
          validators={{
            onChange: ({ value }) =>
              value === null ? "Elegí una unidad de medida" : undefined,
          }}
        >
          {(field) => (
            <div>
              <label htmlFor={field.name} className={claseLabel}>
                Unidad de medida
              </label>
              <select
                id={field.name}
                // El <select> trabaja con texto: null se muestra como "".
                value={field.state.value ?? ""}
                onBlur={field.handleBlur}
                onChange={(e) =>
                  field.handleChange(e.target.value === "" ? null : Number(e.target.value))
                }
                aria-invalid={field.state.meta.errors.length > 0}
                className={claseInput}
              >
                <option value="">Elegí una unidad…</option>
                {unidades.map((unidad) => (
                  <option key={unidad.id} value={unidad.id}>
                    {unidad.nombre} ({unidad.simbolo})
                  </option>
                ))}
              </select>
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
                rows={2}
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
          <form.Subscribe selector={(state) => state.canSubmit}>
            {(canSubmit) => (
              <Button type="submit" disabled={!canSubmit || guardando}>
                {guardando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear ingrediente"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </Modal>
  );
}

export default IngredienteModal;
