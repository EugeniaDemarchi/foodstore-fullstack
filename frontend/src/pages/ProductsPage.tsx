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
import { productoColumnas } from "../columnas/productoColumnas";
import ProductoList from "../components/ProductoList";
import ProductoModal from "../components/ProductoModal";
import { Button } from "../components/ui/Button";
import { EstadoCarga } from "../components/ui/EstadoCarga";
import { EstadoError } from "../components/ui/EstadoError";
import { EstadoVacio } from "../components/ui/EstadoVacio";
import { productoAValores, useProductoForm } from "../hooks/useProductoForm";
import { categoriasService } from "../services/categorias";
import { productosService } from "../services/productos";
import { useAuthStore } from "../store/authStore";
import type { Producto, ProductoInput } from "../types/producto";

const CLAVE_PRODUCTOS = ["productos"];
const SIN_PRODUCTOS: Producto[] = [];

function ProductsPage() {
  // HU-05: la interfaz se adapta al rol. Es SOLO visual: si un "user" llegara a
  // enviar un POST / PUT / DELETE igual, el backend responde 403 (require_role).
  const esAdmin = useAuthStore((s) => s.user?.role === "admin");

  const queryClient = useQueryClient();

  // ---------- Client state (useState) ----------
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [seleccionado, setSeleccionado] = useState<Producto | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });

  // ---------- Server state: LEER (useQuery) ----------
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: CLAVE_PRODUCTOS,
    queryFn: ({ signal }) => productosService.listar(signal),
  });

  // Las categorías para los checkboxes. MISMA clave que en CategoriesPage:
  // comparten la caché, y si allá se crea una categoría, acá también se refresca.
  const categoriasQuery = useQuery({
    queryKey: ["categorias"],
    queryFn: ({ signal }) => categoriasService.listar(signal),
  });

  const invalidarProductos = () =>
    queryClient.invalidateQueries({ queryKey: CLAVE_PRODUCTOS });

  const cerrarModal = () => {
    setIsModalOpen(false);
    setSeleccionado(null);
  };

  // ---------- Server state: MODIFICAR (useMutation) ----------
  const crearMutation = useMutation({
    mutationFn: productosService.crear,
    onSuccess: () => {
      invalidarProductos();
      cerrarModal();
    },
  });

  const actualizarMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductoInput }) =>
      productosService.actualizar(id, data),
    onSuccess: () => {
      invalidarProductos();
      cerrarModal();
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: productosService.eliminar,
    onSuccess: invalidarProductos,
  });

  // ---------- TanStack Form ----------
  const form = useProductoForm((valores) => {
    if (seleccionado) {
      actualizarMutation.mutate({ id: seleccionado.id, data: valores });
    } else {
      crearMutation.mutate(valores);
    }
  });

  // ---------- TanStack Table ----------
  const table = useReactTable({
    data: data ?? SIN_PRODUCTOS,
    columns: productoColumnas,
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

  const abrirModalEditar = (producto: Producto) => {
    actualizarMutation.reset();
    eliminarMutation.reset();
    // keepDefaultValues: carga estos valores SIN reemplazar los defaultValues
    // (si no, el próximo render los vuelve a poner vacíos).
    form.reset(productoAValores(producto), { keepDefaultValues: true });
    setSeleccionado(producto);
    setIsModalOpen(true);
  };

  const handleDelete = (producto: Producto) => {
    if (!window.confirm(`¿Eliminar el producto "${producto.nombre}"?`)) return;
    eliminarMutation.mutate(producto.id);
  };

  const mutacionDelModal = seleccionado ? actualizarMutation : crearMutation;

  // ---------- Render ----------
  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Productos</h1>
        {esAdmin && <Button onClick={abrirModalCrear}>+ Nuevo producto</Button>}
      </div>

      {eliminarMutation.isError && (
        <div className="mb-4">
          <EstadoError
            mensaje="No se pudo eliminar el producto"
            detalle={eliminarMutation.error.message}
          />
        </div>
      )}

      {isPending ? (
        <EstadoCarga />
      ) : isError ? (
        <EstadoError
          mensaje="No se pudieron cargar los productos"
          detalle={error.message}
          onReintentar={() => refetch()}
        />
      ) : data.length === 0 ? (
        <EstadoVacio titulo="Todavía no hay productos">
          {esAdmin ? "Creá el primero con «Nuevo producto»." : "Un administrador puede cargarlos."}
        </EstadoVacio>
      ) : (
        <ProductoList
          table={table}
          onEdit={esAdmin ? abrirModalEditar : undefined}
          onDelete={esAdmin ? handleDelete : undefined}
        />
      )}

      {isModalOpen && (
        <ProductoModal
          form={form}
          categorias={categoriasQuery.data ?? []}
          idEdicion={seleccionado?.id ?? null}
          error={mutacionDelModal.error?.message ?? null}
          guardando={mutacionDelModal.isPending}
          onClose={cerrarModal}
        />
      )}
    </section>
  );
}

export default ProductsPage;
