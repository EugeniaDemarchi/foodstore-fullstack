import type { Table } from "@tanstack/react-table";
import type { Categoria } from "../types/categoria";
import { TablaDatos } from "./ui/TablaDatos";

interface CategoriaListProps {
  table: Table<Categoria>;
  onEdit?: (categoria: Categoria) => void; // solo admin (TP 9)
  onDelete?: (categoria: Categoria) => void;
}

// Presentación pura: recibe la tabla y las acciones por props y reutiliza
// la tabla genérica (la misma que usan productos e ingredientes).
function CategoriaList({ table, onEdit, onDelete }: CategoriaListProps) {
  return <TablaDatos table={table} onEdit={onEdit} onDelete={onDelete} />;
}

export default CategoriaList;
