import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminUsersPage from "./pages/AdminUsersPage";
import CategoriesPage from "./pages/CategoriesPage";
import IngredientsPage from "./pages/IngredientsPage";
import LoginPage from "./pages/LoginPage";
import ProductsPage from "./pages/ProductsPage";
import RegisterPage from "./pages/RegisterPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import { useAuthStore } from "./store/authStore";

// App sigue sin lógica de negocio: arma el esqueleto (Navbar + rutas) y,
// al arrancar, pide confirmar la sesión.
function App() {
  const checkSession = useAuthStore((s) => s.checkSession);

  // HU-04: al iniciar (o recargar) la app, GET /auth/me con la cookie.
  // El arreglo [checkSession] no cambia: se ejecuta UNA vez al montar.
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar titulo="Food Store" />

      <main className="mx-auto max-w-5xl px-6 py-8">
        <Routes>
          {/* ─── Públicas ─── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* ─── Cualquier usuario autenticado ─── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/ingredients" element={<IngredientsPage />} />
          </Route>

          {/* ─── Solo admin ─── */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>

          {/* La app inicia en /categories: si no hay sesión, ProtectedRoute manda a /login */}
          <Route path="/" element={<Navigate to="/categories" replace />} />
          <Route path="*" element={<Navigate to="/categories" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
