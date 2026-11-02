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
import { ingredienteColumnas } from "../columnas/ingredienteColumnas";
import IngredienteList from "../components/IngredienteList";
import IngredienteModal from "../components/IngredienteModal";
import { Button } from "../components/ui/Button";
import { EstadoCarga } from "../components/ui/EstadoCarga";
import { EstadoError } from "../components/ui/EstadoError";
import { EstadoVacio } from "../components/ui/EstadoVacio";
import {
  ingredienteAValores,
  useIngredienteForm,
} from "../hooks/useIngredienteForm";
import { ingredientesService, unidadesMedidaService } from "../services/ingredientes";
import { useAuthStore } from "../store/authStore";
import type { Ingrediente, IngredienteInput } from "../types/ingrediente";

const CLAVE_INGREDIENTES = ["ingredientes"];
const SIN_INGREDIENTES: Ingrediente[] = [];

function IngredientsPage() {
  // HU-05: la interfaz se adapta al rol. Es SOLO visual: si un "user" llegara a
  // enviar un POST / PUT / DELETE igual, el backend responde 403 (require_role).
  const esAdmin = useAuthStore((s) => s.user?.role === "admin");

  const queryClient = useQueryClient();

  // ---------- Client state (useState) ----------
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [seleccionado, setSeleccionado] = useState<Ingrediente | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });

  // ---------- Server state: LEER (useQuery) ----------
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: CLAVE_INGREDIENTES,
    queryFn: ({ signal }) => ingredientesService.listar(signal),
  });

  // Catálogo fijo para el <select>: no cambia, así que no vence nunca.
  const unidadesQuery = useQuery({
    queryKey: ["unidades-medida"],
    queryFn: ({ signal }) => unidadesMedidaService.listar(signal),
    staleTime: Infinity,
  });

  const invalidarIngredientes = () =>
    queryClient.invalidateQueries({ queryKey: CLAVE_INGREDIENTES });

  const cerrarModal = () => {
    setIsModalOpen(false);
    setSeleccionado(null);
  };

  // ---------- Server state: MODIFICAR (useMutation) ----------
  const crearMutation = useMutation({
    mutationFn: ingredientesService.crear,
    onSuccess: () => {
      invalidarIngredientes();
      cerrarModal();
    },
  });

  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: IngredienteInput }) =>
      ingredientesService.actualizar(id, data),
    onSuccess: () => {
      invalidarIngredientes();
      cerrarModal();
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: ingredientesService.eliminar,
    onSuccess: invalidarIngredientes,
  });

  // ---------- TanStack Form ----------
  const form = useIngredienteForm((valores) => {
    if (seleccionado) {
      actualizarMutation.mutate({ id: seleccionado.id, data: valores });
    } else {
      crearMutation.mutate(valores);
    }
  });

  // ---------- TanStack Table ----------
  const table = useReactTable({
    data: data ?? SIN_INGREDIENTES,
    columns: ingredienteColumnas,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // ---------- Handlers ----------
  const abrirModalCrear = () => {
    crearMutation.reset();
    eliminarMutation.reset();
    form.reset(); // vuelve a los defaultValues: formulario vacío
    setSeleccionado(null);
    setIsModalOpen(true);
  };

  const abrirModalEditar = (ingrediente: Ingrediente) => {
    actualizarMutation.reset();
    eliminarMutation.reset();
    // keepDefaultValues: carga estos valores SIN reemplazar los defaultValues
    // (si no, el próximo render los vuelve a poner vacíos).
    form.reset(ingredienteAValores(ingrediente), { keepDefaultValues: true });
    setSeleccionado(ingrediente);
    setIsModalOpen(true);
  };

  const handleDelete = (ingrediente: Ingrediente) => {
    if (!window.confirm(`¿Eliminar el ingrediente "${ingrediente.nombre}"?`)) return;
    eliminarMutation.mutate(ingrediente.id);
  };

  const mutacionDelModal = seleccionado ? actualizarMutation : crearMutation;

  // ---------- Render ----------
  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Ingredientes</h1>
        {esAdmin && <Button onClick={abrirModalCrear}>+ Nuevo ingrediente</Button>}
      </div>

      {eliminarMutation.isError && (
        <div className="mb-4">
          <EstadoError
            mensaje="No se pudo eliminar el ingrediente"
            detalle={eliminarMutation.error.message}
          />
        </div>
      )}

      {isPending ? (
        <EstadoCarga />
      ) : isError ? (
        <EstadoError
          mensaje="No se pudieron cargar los ingredientes"
          detalle={error.message}
          onReintentar={() => refetch()}
        />
      ) : data.length === 0 ? (
        <EstadoVacio titulo="Todavía no hay ingredientes">
          {esAdmin ? "Creá el primero con «Nuevo ingrediente»." : "Un administrador puede cargarlos."}
        </EstadoVacio>
      ) : (
        <IngredienteList
          table={table}
          onEdit={esAdmin ? abrirModalEditar : undefined}
          onDelete={esAdmin ? handleDelete : undefined}
        />
      )}

      {isModalOpen && (
        <IngredienteModal
          form={form}
          unidades={unidadesQuery.data ?? []}
          idEdicion={seleccionado?.id ?? null}
          error={mutacionDelModal.error?.message ?? null}
          guardando={mutacionDelModal.isPending}
          onClose={cerrarModal}
        />
      )}
    </section>
  );
}

export default IngredientsPage;
