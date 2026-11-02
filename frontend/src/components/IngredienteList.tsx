import type { Table } from "@tanstack/react-table";
import type { Ingrediente } from "../types/ingrediente";
import { TablaDatos } from "./ui/TablaDatos";

interface IngredienteListProps {
  table: Table<Ingrediente>;
  onEdit?: (ingrediente: Ingrediente) => void; // solo admin (TP 9)
  onDelete?: (ingrediente: Ingrediente) => void;
}

function IngredienteList({ table, onEdit, onDelete }: IngredienteListProps) {
  return <TablaDatos table={table} onEdit={onEdit} onDelete={onDelete} />;
}

export default IngredienteList;
