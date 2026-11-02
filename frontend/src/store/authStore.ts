import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { authService } from "../services/auth";
import type { CredencialesLogin, UsuarioAuth, UsuarioPublico } from "../types/auth.types";

// ─────────────────────────────────────────────────────────────────────
// AuthStore: estado GLOBAL de la sesión (lo leen Navbar, ProtectedRoute y LoginPage).
//
// NO guarda el token (RN-03): el token vive en la cookie HttpOnly, que escribe
// el servidor y JavaScript no puede leer. Acá solo están los datos del usuario
// que la interfaz necesita para adaptarse (nombre, email, rol).
// ─────────────────────────────────────────────────────────────────────

interface AuthState {
  // ---------- Estado ----------
  user: UsuarioAuth | null;
  // true mientras se confirma la sesión con GET /auth/me al iniciar la app.
  isChecking: boolean;

  // ---------- Acciones ----------
  login: (credenciales: CredencialesLogin) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  limpiarSesion: () => void; // la usa el interceptor de Axios ante un 401
}

// De lo que devuelve /auth/me se guardan SOLO los campos que la interfaz usa:
// cuanto menos se persiste en el navegador, menos se expone.
function aUsuarioAuth({ username, full_name, email, role }: UsuarioPublico): UsuarioAuth {
  return { username, full_name, email, role };
}

export const useAuthStore = create<AuthState>()(
  // persist: guarda el store en sessionStorage y lo restaura (rehidrata) al recargar.
  persist(
    (set) => ({
      user: null,
      isChecking: true,

      // HU-02: POST /auth/token (el servidor deja la cookie) -> GET /auth/me (datos).
      // Si las credenciales son incorrectas, el error SE PROPAGA: LoginPage lo
      // captura y muestra el mensaje sin recargar la página.
      login: async (credenciales) => {
        await authService.login(credenciales);
        const usuario = await authService.me();
        set({ user: aUsuarioAuth(usuario) });
      },

      // HU-03: el servidor borra la cookie y se limpia el store.
      // finally: el store se limpia AUNQUE el pedido falle (p. ej. backend caído).
      // Ojo: limpiar solo el store no alcanza; si la cookie siguiera, la sesión seguiría viva.
      logout: async () => {
        try {
          await authService.logout();
        } finally {
          set({ user: null });
        }
      },

      // HU-04: al iniciar la app se confirma la sesión con el servidor.
      // Lo guardado en sessionStorage es una COPIA: puede estar vencida (la cookie
      // dura 30 min) o la cuenta pudo desactivarse. Decide el backend.
      checkSession: async () => {
        set({ isChecking: true });
        try {
          const usuario = await authService.me();
          set({ user: aUsuarioAuth(usuario) });
        } catch {
          // 401 (sin sesión / vencida), 400 (desactivada) o backend caído.
          set({ user: null });
        } finally {
          set({ isChecking: false });
        }
      },

      limpiarSesion: () => set({ user: null }),
    }),
    {
      name: "auth-storage", // clave en sessionStorage (se ve en DevTools > Aplicación)
      // sessionStorage: se borra al cerrar la pestaña (menos exposición que localStorage).
      storage: createJSONStorage(() => sessionStorage),
      // partialize: se persiste SOLO el usuario; isChecking no tiene sentido restaurarlo.
      // (No es una medida de seguridad: lo que protege el token es que no está acá.)
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
