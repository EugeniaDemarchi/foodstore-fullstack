import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { categoriaColumnas } from "../columnas/categoriaColumnas";
import CategoriaList from "../components/CategoriaList";
import CategoriaModal from "../components/CategoriaModal";
import { Button } from "../components/ui/Button";
import { EstadoCarga } from "../components/ui/EstadoCarga";
import { EstadoError } from "../components/ui/EstadoError";
import { EstadoVacio } from "../components/ui/EstadoVacio";
import {
  categoriaAValores,
  useCategoriaForm,
} from "../hooks/useCategoriaForm";
import { categoriasService } from "../services/categorias";
import { useAuthStore } from "../store/authStore";
import type { Categoria, CategoriaInput } from "../types/categoria";

const CLAVE_CATEGORIAS = ["categorias"];
// Constante FUERA del componente: mientras no hay datos, la tabla recibe
// siempre el MISMO arreglo vacío (un [] literal sería uno nuevo en cada render).
const SIN_CATEGORIAS: Categoria[] = [];

function CategoriesPage() {
  // HU-05: la interfaz se adapta al rol. Es SOLO visual: si un "user" llegara a
  // enviar un POST / PUT / DELETE igual, el backend responde 403 (require_role).
  const esAdmin = useAuthStore((s) => s.user?.role === "admin");

  const queryClient = useQueryClient();

  // ---------- Client state (useState) ----------
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [seleccionada, setSeleccionada] = useState<Categoria | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });

  // ---------- Server state: LEER (useQuery) ----------
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: CLAVE_CATEGORIAS,
    queryFn: ({ signal }) => categoriasService.listar(signal),
  });

  const invalidarCategorias = () =>
    queryClient.invalidateQueries({ queryKey: CLAVE_CATEGORIAS });

  const cerrarModal = () => {
    setIsModalOpen(false);
    setSeleccionada(null);
  };

  // ---------- Server state: MODIFICAR (useMutation) ----------
  const crearMutation = useMutation({
    mutationFn: categoriasService.crear,
    onSuccess: () => {
      invalidarCategorias();
      cerrarModal();
    },
  });

  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoriaInput }) =>
      categoriasService.actualizar(id, data),
    onSuccess: () => {
      invalidarCategorias();
      // Los productos muestran el nombre de sus categorías: también quedan viejos.
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      cerrarModal();
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: categoriasService.eliminar,
    onSuccess: invalidarCategorias,
  });

  // ---------- TanStack Form: el formulario del modal ----------
  const form = useCategoriaForm((valores) => {
    if (seleccionada) {
      actualizarMutation.mutate({ id: seleccionada.id, data: valores });
    } else {
      crearMutation.mutate(valores);
    }
  });

  // ---------- TanStack Table: ordenamiento + paginación ----------
  const table = useReactTable({
    data: data ?? SIN_CATEGORIAS,
    columns: categoriaColumnas,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // ---------- Handlers ----------
  const abrirModalCrear = () => {
    crearMutation.reset(); // limpia el error de un intento anterior
    eliminarMutation.reset();
    form.reset(); // vuelve a los defaultValues: formulario vacío
    setSeleccionada(null);
    setIsModalOpen(true);
  };

  const abrirModalEditar = (categoria: Categoria) => {
    actualizarMutation.reset();
    eliminarMutation.reset();
    // keepDefaultValues: carga estos valores SIN reemplazar los defaultValues
    // (si no, el próximo render los vuelve a poner vacíos).
    form.reset(categoriaAValores(categoria), { keepDefaultValues: true });
    setSeleccionada(categoria);
    setIsModalOpen(true);
  };

  const handleDelete = (categoria: Categoria) => {
    if (!window.confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) return; // HU-04
    eliminarMutation.mutate(categoria.id);
  };

  const mutacionDelModal = seleccionada ? actualizarMutation : crearMutation;

  // ---------- Render ----------
  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Categorías</h1>
        {esAdmin && <Button onClick={abrirModalCrear}>+ Nueva categoría</Button>}
      </div>

      {/* Error al eliminar (p. ej. 409 por RN-05: tiene productos asociados) */}
      {eliminarMutation.isError && (
        <div className="mb-4">
          <EstadoError
            mensaje="No se pudo eliminar la categoría"
            detalle={eliminarMutation.error.message}
          />
        </div>
      )}

      {/* Orden de los estados: carga -> error -> vacío -> datos */}
      {isPending ? (
        <EstadoCarga />
      ) : isError ? (
        <EstadoError
          mensaje="No se pudieron cargar las categorías"
          detalle={error.message}
          onReintentar={() => refetch()}
        />
      ) : data.length === 0 ? (
        <EstadoVacio titulo="Todavía no hay categorías">
          {esAdmin ? "Creá la primera con «Nueva categoría»." : "Un administrador puede cargarlos."}
        </EstadoVacio>
      ) : (
        <CategoriaList
          table={table}
          onEdit={esAdmin ? abrirModalEditar : undefined}
          onDelete={esAdmin ? handleDelete : undefined}
        />
      )}

      {isModalOpen && (
        <CategoriaModal
          form={form}
          idEdicion={seleccionada?.id ?? null}
          error={mutacionDelModal.error?.message ?? null}
          guardando={mutacionDelModal.isPending}
          onClose={cerrarModal}
        />
      )}
    </section>
  );
}

export default CategoriesPage;
