import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

// Destino de ProtectedRoute cuando HAY sesión pero el rol no está permitido
// (p. ej. un usuario "user" que entra a /admin/users).
function UnauthorizedPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <p className="text-5xl font-bold text-slate-300">403</p>
      <h1 className="mt-2 text-xl font-semibold text-slate-900">Acceso denegado</h1>
      <p className="mt-2 text-sm text-slate-500">
        {user
          ? `Tu rol (${user.role}) no tiene permiso para ver esta página.`
          : "No tenés permiso para ver esta página."}
      </p>
      <Link
        to={user ? "/categories" : "/login"}
        className="mt-6 inline-block rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover"
      >
        {user ? "Volver a categorías" : "Ir al login"}
      </Link>
    </div>
  );
}

export default UnauthorizedPage;
