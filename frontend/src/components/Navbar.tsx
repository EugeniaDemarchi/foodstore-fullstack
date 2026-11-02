import { useQueryClient } from "@tanstack/react-query";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import type { Rol } from "../types/auth.types";

interface NavbarProps {
  titulo: string;
}

interface Enlace {
  to: string;
  texto: string;
  soloRol?: Rol; // si está, el enlace solo se muestra a ese rol
}

const ENLACES: Enlace[] = [
  { to: "/categories", texto: "Categorías" },
  { to: "/products", texto: "Productos" },
  { to: "/ingredients", texto: "Ingredientes" },
  { to: "/admin/users", texto: "Usuarios", soloRol: "admin" },
];

const claseEnlace = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-white text-slate-900" : "text-slate-300 hover:bg-slate-800 hover:text-white"
  }`;

function Navbar({ titulo }: NavbarProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // HU-03: borra la cookie (backend), limpia el store y vuelve al login.
  const cerrarSesion = async () => {
    await logout();
    // Se vacía la caché de TanStack Query: el próximo usuario no debe ver
    // datos que se cargaron con la sesión anterior.
    queryClient.clear();
    navigate("/login", { replace: true });
  };

  return (
    <header className="bg-slate-900 text-white">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <span className="text-lg font-semibold tracking-tight">{titulo}</span>

        {/* Sin sesión no se muestran los enlaces: llevarían igual al login. */}
        {user && (
          <ul className="flex flex-wrap gap-2">
            {ENLACES.filter((e) => !e.soloRol || e.soloRol === user.role).map((enlace) => (
              <li key={enlace.to}>
                {/* NavLink = Link que además sabe si su ruta está activa */}
                <NavLink to={enlace.to} className={claseEnlace}>
                  {enlace.texto}
                </NavLink>
              </li>
            ))}
          </ul>
        )}

        {/* HU-04: nombre y rol del usuario + botón de cierre de sesión */}
        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium">{user.full_name}</p>
              <p className="text-xs text-slate-400">
                @{user.username} ·{" "}
                <span className={user.role === "admin" ? "text-amber-300" : "text-sky-300"}>
                  {user.role}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={cerrarSesion}
              className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-slate-800"
            >
              Cerrar sesión
            </button>
          </div>
        ) : (
          <NavLink to="/login" className={claseEnlace}>
            Iniciar sesión
          </NavLink>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
