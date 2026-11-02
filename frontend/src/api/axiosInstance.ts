import axios, { AxiosError } from "axios";
import { useAuthStore } from "../store/authStore";

// ─────────────────────────────────────────────────────────────────────
// Instancia ÚNICA de Axios: todas las peticiones del frontend pasan por acá (HU-07).
// ─────────────────────────────────────────────────────────────────────
export const api = axios.create({
  // Raíz de todas las rutas. Se lee del .env: cambiar de entorno no toca el código.
  // Tiene que ser "localhost" (no 127.0.0.1) para que la cookie viaje (ver .env.example).
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
  // Si el backend no responde en 10 s, se corta (por defecto Axios esperaría siempre).
  timeout: 10000,
  // El frontend (:5173) y la API (:8000) son orígenes distintos. Con esto el
  // navegador GUARDA la cookie HttpOnly del login y la ENVÍA en cada petición.
  // Funciona junto con allow_credentials=True del backend (CORS).
  withCredentials: true,
});

// ─────────────────────────────────────────────────────────────────────
// Error con el código HTTP. Las páginas muestran error.message, igual que en el TP 8.
// ─────────────────────────────────────────────────────────────────────
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface ErrorValidacion {
  loc: (string | number)[];
  msg: string;
}

interface CuerpoDeError {
  detail?: string | ErrorValidacion[];
}

// FastAPI responde los errores como {"detail": ...} (RN-12):
// - 400 / 401 / 403 / 404 / 409 -> detail es un texto
// - 422                         -> detail es una lista de errores de validación
function extraerMensaje(error: AxiosError<CuerpoDeError>): string {
  if (error.code === "ECONNABORTED") return "El servidor tardó demasiado en responder.";
  if (!error.response) return "No se pudo conectar con el servidor.";

  const { status, data } = error.response;
  const detail = data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((e) => `${e.loc.at(-1)}: ${e.msg}`).join(" · ");
  }
  if (status >= 500) return "Error del servidor. Intente nuevamente más tarde.";
  return `Error ${status}`;
}

// ─────────────────────────────────────────────────────────────────────
// Interceptor de SOLICITUD: NO maneja el token.
// El token viaja en la cookie HttpOnly, que JavaScript no puede leer;
// el navegador la adjunta solo gracias a withCredentials (RN-03).
// Por eso no hace falta registrar ninguno.
// ─────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────
// Interceptor de RESPUESTA: maneja la sesión vencida de forma global (HU-04, HU-07).
// ─────────────────────────────────────────────────────────────────────

// En estas rutas un 401 es parte del funcionamiento normal:
// - /auth/token: 401 = credenciales incorrectas -> lo muestra el formulario de login.
// - /auth/me: 401 = no hay sesión -> lo maneja checkSession() del store.
const RUTAS_DE_AUTH = ["/api/v1/auth/token", "/api/v1/auth/me"];

api.interceptors.response.use(
  // Respuesta 2xx: pasa sin cambios.
  (response) => response,

  // Respuesta con error:
  (error: AxiosError<CuerpoDeError>) => {
    const url = error.config?.url ?? "";
    const esDeAuth = RUTAS_DE_AUTH.some((ruta) => url.includes(ruta));

    if (error.response?.status === 401 && !esDeAuth) {
      // La cookie venció (30 min) o no existe: se vacía el store y,
      // como ProtectedRoute lee el store, la app vuelve sola a /login.
      useAuthStore.getState().limpiarSesion();
    }

    // Se propaga el error: el componente que hizo la petición también se entera
    // (TanStack Query lo pone en isError y la página muestra el mensaje).
    return Promise.reject(new ApiError(extraerMensaje(error), error.response?.status ?? 0));
  },
);
