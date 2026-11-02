import { calcularPrincipal, type ProductoForm } from "../hooks/useProductoForm";
import type { Categoria } from "../types/categoria";
import { Button } from "./ui/Button";
import { claseInput, claseLabel, ErrorApi, ErroresCampo } from "./ui/campos";
import { Modal } from "./ui/Modal";

interface ProductoModalProps {
  form: ProductoForm;
  categorias: Categoria[]; // opciones para los checkboxes
  idEdicion: number | null;
  error: string | null;
  guardando: boolean;
  onClose: () => void;
}

function ProductoModal({
  form,
  categorias,
  idEdicion,
  error,
  guardando,
  onClose,
}: ProductoModalProps) {
  const esEdicion = idEdicion !== null;

  return (
    <Modal
      titulo={esEdicion ? "Editar producto" : "Nuevo producto"}
      subtitulo={
        esEdicion
          ? `Modificando el producto #${idEdicion}`
          : "Completá los datos para crear un producto"
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
            // RN-06: obligatorio (no único)
            onChange: ({ value }) =>
              !value.trim() ? "El nombre es obligatorio" : undefined,
            onBlur: ({ value }) =>
              value.trim().length > 150 ? "Máximo 150 caracteres" : undefined,
          }}
        >
          {(field) => (
            <div>
              <label htmlFor={field.name} className={claseLabel}>
                Nombre
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
                rows={2}
                className={claseInput}
              />
            </div>
          )}
        </form.Field>

        <div className="grid grid-cols-2 gap-4">
          <form.Field
            name="precio_base"
            validators={{
              // RN-07: obligatorio y no negativo
              onChange: ({ value }) => {
                if (value.trim() === "") return "El precio es obligatorio";
                const precio = Number(value);
                if (Number.isNaN(precio)) return "Ingresá un número válido";
                if (precio < 0) return "El precio no puede ser negativo";
                return undefined;
              },
            }}
          >
            {(field) => (
              <div>
                <label htmlFor={field.name} className={claseLabel}>
                  Precio base ($)
                </label>
                <input
                  id={field.name}
                  type="number"
                  min={0}
                  step={0.01}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={field.state.meta.errors.length > 0}
                  className={claseInput}
                />
                <ErroresCampo errores={field.state.meta.errors} />
              </div>
            )}
          </form.Field>

          <form.Field name="disponible">
            {(field) => (
              <label className="mt-7 flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={field.state.value}
                  onChange={(e) => field.handleChange(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Disponible para la venta
              </label>
            )}
          </form.Field>
        </div>

        <form.Field name="imagenes">
          {(field) => (
            <div>
              <label htmlFor={field.name} className={claseLabel}>
                Imágenes{" "}
                <span className="font-normal text-slate-400">(una URL por línea, opcional)</span>
              </label>
              <textarea
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                rows={2}
                placeholder="https://ejemplo.com/foto.jpg"
                className={claseInput}
              />
            </div>
          )}
        </form.Field>

        <form.Field
          name="categoria_ids"
          validators={{
            // RN-19 (backend): al menos una categoría
            onSubmit: ({ value }) =>
              value.length === 0 ? "Elegí al menos una categoría" : undefined,
          }}
        >
          {(field) => (
            <fieldset>
              <legend className={claseLabel}>
                Categorías{" "}
                <span className="font-normal text-slate-400">(al menos una · ★ = principal)</span>
              </legend>

              {categorias.length === 0 ? (
                <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  No hay categorías. Creá una en la sección Categorías antes de cargar productos.
                </p>
              ) : (
                // principal_id es OTRO campo: se lee con form.Subscribe
                <form.Subscribe selector={(state) => state.values.principal_id}>
                  {(principalId) => {
                    const principal = calcularPrincipal(field.state.value, principalId);
                    return (
                      <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2">
                        {categorias.map((categoria) => {
                          const marcada = field.state.value.includes(categoria.id);
                          const esPrincipal = principal === categoria.id;
                          return (
                            <li
                              key={categoria.id}
                              className="flex items-center justify-between rounded px-2 py-1 hover:bg-slate-50"
                            >
                              <label className="flex flex-1 items-center gap-2 text-sm text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={marcada}
                                  onChange={() =>
                                    field.handleChange(
                                      marcada
                                        ? field.state.value.filter((id) => id !== categoria.id)
                                        : [...field.state.value, categoria.id],
                                    )
                                  }
                                  className="h-4 w-4 rounded border-slate-300"
                                />
                                {categoria.nombre}
                              </label>
                              {marcada && (
                                <button
                                  type="button"
                                  onClick={() => form.setFieldValue("principal_id", categoria.id)}
                                  aria-pressed={esPrincipal}
                                  title="Marcar como categoría principal"
                                  className={`rounded px-2 text-sm ${
                                    esPrincipal
                                      ? "text-amber-500"
                                      : "text-slate-300 hover:text-amber-400"
                                  }`}
                                >
                                  ★ {esPrincipal && <span className="text-xs">principal</span>}
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    );
                  }}
                </form.Subscribe>
              )}
              <ErroresCampo errores={field.state.meta.errors} />
            </fieldset>
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
                {guardando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear producto"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </Modal>
  );
}

export default ProductoModal;
