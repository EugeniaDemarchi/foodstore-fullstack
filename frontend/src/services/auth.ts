import { api } from "../api/axiosInstance";
import type {
  CredencialesLogin,
  DatosRegistro,
  MensajeRespuesta,
  UsuarioPublico,
} from "../types/auth.types";

const RUTA = "/api/v1/auth";

export const authService = {
  // POST /auth/token: OAuth2 espera un FORMULARIO (x-www-form-urlencoded), no JSON.
  // URLSearchParams arma ese formato y Axios pone el Content-Type correcto.
  // El servidor responde con Set-Cookie (HttpOnly): el token nunca llega a JavaScript.
  login: async ({ username, password }: CredencialesLogin): Promise<void> => {
    await api.post<MensajeRespuesta>(`${RUTA}/token`, new URLSearchParams({ username, password }));
  },

  // GET /auth/me: "¿quién soy?" según la cookie. 401 si no hay sesión válida.
  me: async (): Promise<UsuarioPublico> => (await api.get<UsuarioPublico>(`${RUTA}/me`)).data,

  // POST /auth/logout: el servidor responde con un Set-Cookie que BORRA la cookie.
  logout: async (): Promise<void> => {
    await api.post<MensajeRespuesta>(`${RUTA}/logout`);
  },

  // POST /auth/register: público. El backend siempre asigna rol "user".
  registrar: async (datos: DatosRegistro): Promise<UsuarioPublico> =>
    (await api.post<UsuarioPublico>(`${RUTA}/register`, datos)).data,

  // ─── Administración (solo admin) ───
  listarUsuarios: async (): Promise<UsuarioPublico[]> =>
    (await api.get<UsuarioPublico[]>(`${RUTA}/admin/usuarios`)).data,

  activar: async (id: number): Promise<UsuarioPublico> =>
    (await api.post<UsuarioPublico>(`${RUTA}/admin/usuarios/${id}/activar`)).data,

  desactivar: async (id: number): Promise<UsuarioPublico> =>
    (await api.post<UsuarioPublico>(`${RUTA}/admin/usuarios/${id}/desactivar`)).data,
};
