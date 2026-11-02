// Campos de auditoría que el backend agrega a cada entidad (AuditMixin).
// Son string porque JSON no tiene tipo "fecha": llegan como texto ISO 8601.
export interface Auditoria {
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
