import type { Table } from "@tanstack/react-table";
import type { Producto } from "../types/producto";
import { TablaDatos } from "./ui/TablaDatos";

interface ProductoListProps {
  table: Table<Producto>;
  onEdit?: (producto: Producto) => void; // solo admin (TP 9)
  onDelete?: (producto: Producto) => void;
}

function ProductoList({ table, onEdit, onDelete }: ProductoListProps) {
  return <TablaDatos table={table} onEdit={onEdit} onDelete={onDelete} />;
}

export default ProductoList;
