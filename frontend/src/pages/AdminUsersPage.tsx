import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/Button";
import { ErrorApi } from "../components/ui/campos";
import { EstadoCarga } from "../components/ui/EstadoCarga";
import { EstadoError } from "../components/ui/EstadoError";
import { authService } from "../services/auth";
import { useAuthStore } from "../store/authStore";
import type { UsuarioPublico } from "../types/auth.types";

const CLAVE_USUARIOS = ["admin", "usuarios"];

// Solo admin (lo garantizan ProtectedRoute en el frontend y require_role en el backend).
// Activar / Desactivar = borrado lógico del usuario (campo disabled, RN-11).
function AdminUsersPage() {
  const queryClient = useQueryClient();
  const yo = useAuthStore((s) => s.user);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: CLAVE_USUARIOS,
    queryFn: authService.listarUsuarios,
  });

  const cambiarEstado = useMutation({
    mutationFn: (usuario: UsuarioPublico) =>
      usuario.disabled ? authService.activar(usuario.id) : authService.desactivar(usuario.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CLAVE_USUARIOS }),
  });

  return (
    <section>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Usuarios</h1>
        <p className="text-sm text-slate-500">
          Un usuario desactivado no puede iniciar sesión ni usar la API (responde 400).
        </p>
      </header>

      {isPending && <EstadoCarga filas={3} />}
      {isError && (
        <EstadoError mensaje="No se pudieron cargar los usuarios" detalle={error.message} onReintentar={refetch} />
      )}

      <ErrorApi mensaje={cambiarEstado.isError ? cambiarEstado.error.message : null} />

      {data && (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((u) => {
                const esYo = u.username === yo?.username;
                const procesando = cambiarEstado.isPending && cambiarEstado.variables?.id === u.id;
                return (
                  <tr key={u.id} className={u.disabled ? "bg-slate-50 text-slate-400" : ""}>
                    <td className="px-4 py-3">{u.id}</td>
                    <td className="px-4 py-3 font-medium">@{u.username}</td>
                    <td className="px-4 py-3">{u.full_name}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">{u.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.disabled ? "bg-red-50 text-error" : "bg-emerald-50 text-success"
                        }`}
                      >
                        {u.disabled ? "Desactivado" : "Activo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {/* No se permite desactivarse a uno mismo: el admin se quedaría afuera. */}
                      {esYo ? (
                        <span className="text-xs text-slate-400">Vos</span>
                      ) : (
                        <Button
                          variant={u.disabled ? "primary" : "outline"}
                          disabled={procesando}
                          onClick={() => cambiarEstado.mutate(u)}
                        >
                          {procesando ? "…" : u.disabled ? "Activar" : "Desactivar"}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default AdminUsersPage;
