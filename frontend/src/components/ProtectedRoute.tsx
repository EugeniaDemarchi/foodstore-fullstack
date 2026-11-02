import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import type { Rol } from "../types/auth.types";

interface ProtectedRouteProps {
  // Roles permitidos. Si no se pasa, alcanza con tener sesión (cualquier rol).
  allowedRoles?: Rol[];
  // Opcional: se puede usar envolviendo una página o como "ruta padre" (Outlet).
  children?: ReactNode;
}

// ─────────────────────────────────────────────────────────────────────
// ProtectedRoute: el "portero" del FRONTEND (HU-06).
//
// Ojo: es solo para la EXPERIENCIA del usuario (no mostrar pantallas que no puede usar).
// La seguridad real está en el backend: aunque alguien saltee este componente,
// la API responde 401 / 403.
// ─────────────────────────────────────────────────────────────────────
function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const user = useAuthStore((s) => s.user);
  const isChecking = useAuthStore((s) => s.isChecking);

  // 1) Mientras se confirma la sesión con /auth/me: indicador de carga (HU-04).
  //    Sin esto, al recargar se vería un instante el login aunque la sesión sea válida.
  if (isChecking) {
    return (
      <div className="mx-auto mt-16 max-w-md text-center text-sm text-slate-500" aria-busy="true">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand" />
        Restaurando sesión…
      </div>
    );
  }

  // 2) Sin sesión -> al login (replace: el botón "atrás" no vuelve a la ruta protegida).
  if (!user) return <Navigate to="/login" replace />;

  // 3) Con sesión pero rol no permitido -> acceso denegado.
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 4) Todo OK: se muestra la página (children) o las rutas hijas (Outlet).
  return children ?? <Outlet />;
}

export default ProtectedRoute;
