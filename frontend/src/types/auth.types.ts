// ─────────────────────────────────────────────────────────────────────
// Tipos de autenticación. Espejo de los esquemas del backend (app/modules/usuarios/schema.py).
// ─────────────────────────────────────────────────────────────────────

export type Rol = "user" | "admin";

// Lo que el frontend guarda del usuario logueado (AuthStore + sessionStorage).
// NO tiene el token (RN-03) ni la contraseña: solo lo que la interfaz necesita mostrar.
export interface UsuarioAuth {
  username: string;
  full_name: string;
  email: string;
  role: Rol;
}

// Respuesta de GET /auth/me y de /admin/usuarios (UserPublic del backend).
export interface UsuarioPublico extends UsuarioAuth {
  id: number;
  disabled: boolean;
}

// Datos del formulario de login (se envían como formulario OAuth2, no JSON).
export interface CredencialesLogin {
  username: string;
  password: string;
}

// Datos del formulario de registro (UserCreate del backend).
export interface DatosRegistro {
  username: string;
  full_name: string;
  email: string;
  password: string;
}

// Respuesta de /auth/token y /auth/logout.
export interface MensajeRespuesta {
  mensaje: string;
}
