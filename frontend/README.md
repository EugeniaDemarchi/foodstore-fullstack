# Food Store (Frontend): TP Unidad 9 (Programación IV)

Frontend en **React + TypeScript + Vite + Tailwind CSS 4**. Consume la API FastAPI (`../backend`) **con sesión**.

- **Nuevo en la U9:** Axios con interceptores, AuthStore con **Zustand + `persist`**, login y registro con TanStack Form, **rutas protegidas** por sesión y por rol, e interfaz condicional según el rol.
- **De la U8:** CRUD de Categorías, Productos e Ingredientes con TanStack Query, Form y Table, y React Router.

## Cómo ejecutarlo (Windows)

Requiere el backend corriendo en **http://localhost:8000**.

```cmd
copy .env.example .env
npm.cmd install
npm.cmd run dev
```

- Abrir **http://localhost:5173**, el origen que el backend habilita por CORS.
- **Importante:** `VITE_API_URL` tiene que usar `localhost`, no `127.0.0.1`. Para el navegador son sitios distintos, y con `127.0.0.1` la cookie (`SameSite=Lax`) no viajaría en los pedidos.
- Usuarios de prueba: `admin` / `Admin1234!` (admin) y `juan` / `Juan1234!` (user).
- Chequeo de tipos y build: `npm.cmd run build`, con TypeScript en `"strict": true`.

> Dependencias nuevas: `npm.cmd install axios zustand`. Equivale al `pnpm add axios zustand` de la consigna.

## Seguridad en el frontend (TP 9)

**Regla central:** el frontend **nunca ve el token**. El backend lo entrega en una cookie `HttpOnly`, que JavaScript no puede leer, y el navegador la manda sola en cada pedido. El frontend solo guarda los datos del usuario que la interfaz necesita mostrar.

| Pieza | Archivo | Qué hace |
|---|---|---|
| **Instancia de Axios** | `api/axiosInstance.ts` | `baseURL` desde `VITE_API_URL`, `timeout` de 10 s y **`withCredentials: true`**, para que el navegador guarde y envíe la cookie. **Todas** las peticiones pasan por acá (HU-07). |
| Interceptor de solicitud | `api/axiosInstance.ts` | **No se usa**: no hay token que agregar, porque viaja solo en la cookie |
| **Interceptor de respuesta** | `api/axiosInstance.ts` | Ante un **401** (salvo en `/auth/token` y `/auth/me`) vacía el AuthStore, y `ProtectedRoute` manda a `/login`. Además traduce el `{"detail": …}` de FastAPI a un mensaje legible. |
| **AuthStore** | `store/authStore.ts` | Zustand. Estado: `user` (`UsuarioAuth`) e `isChecking`. Acciones: `login`, `logout`, `checkSession` y `limpiarSesion`. **Sin campo `token`.** |
| `persist` | `store/authStore.ts` | Guarda **solo `user`** (`partialize`) en **sessionStorage**, con la clave `auth-storage`. Al recargar se rehidrata y `checkSession()` lo confirma con `GET /auth/me`. |
| Tipos | `types/auth.types.ts` | `UsuarioAuth`, `UsuarioPublico`, `CredencialesLogin`, `DatosRegistro`, `MensajeRespuesta` (sin `any`) |
| Servicio | `services/auth.ts` | `login` (como **formulario** OAuth2 con `URLSearchParams`), `me`, `logout`, `registrar` y la administración de usuarios |
| **ProtectedRoute** | `components/ProtectedRoute.tsx` | Mientras `isChecking`, muestra "Restaurando sesión…". Sin sesión → `/login`. Rol no permitido → `/unauthorized`. |
| **Navbar** | `components/Navbar.tsx` | Nombre, usuario y rol, y el botón **Cerrar sesión**, que borra la cookie, limpia el store y la caché de TanStack Query. El enlace "Usuarios" aparece solo para admin. |
| Interfaz por rol | Las tres páginas + `TablaDatos` | "+ Nuevo…", "Editar" y "Eliminar" se muestran **solo a `admin`**. Si un `user` mandara igual la petición, el backend responde **403**. |

### Rutas (`App.tsx`)

| Ruta | Página | Acceso |
|---|---|---|
| `/login`, `/register`, `/unauthorized` | Login, registro, acceso denegado | Públicas |
| `/categories`, `/products`, `/ingredients` | Listados del CRUD | Cualquier usuario autenticado |
| `/admin/users` | Usuarios, con Activar y Desactivar | Solo `admin` |
| `/` y cualquier otra | Redirige a `/categories` (sin sesión, termina en `/login`) | — |

### Flujo de la sesión

```
LOGIN      LoginPage (TanStack Form) → authStore.login()
             → POST /api/v1/auth/token  → el navegador guarda la cookie HttpOnly
             → GET  /api/v1/auth/me     → user en el store → sessionStorage → /categories

RECARGA    sessionStorage → store (user)
           App monta → checkSession() → GET /auth/me (con la cookie)
             ├─ 200          → sigue la sesión
             └─ 401 / 400    → user = null → ProtectedRoute → /login

VENCE      cualquier pedido → 401 → interceptor → limpiarSesion() → /login

LOGOUT     Navbar → authStore.logout() → POST /auth/logout (borra la cookie)
             → user = null → queryClient.clear() → /login
```

## Estructura

```
src/
├── main.tsx              → providers: QueryClientProvider + BrowserRouter
├── App.tsx               → rutas (públicas / protegidas / admin) + checkSession() al montar
├── api/
│   └── axiosInstance.ts  → U9: instancia única + interceptor de respuesta (401) + ApiError
├── store/
│   └── authStore.ts      → U9: Zustand + persist (sessionStorage, solo el usuario)
├── types/
│   ├── auth.types.ts     → U9: UsuarioAuth y tipos de login / registro
│   └── categoria.ts · producto.ts · ingrediente.ts · paginacion.ts · auditoria.ts
├── services/             → un archivo por entidad, todos con la instancia de Axios
│   └── auth.ts · categorias.ts · productos.ts · ingredientes.ts
├── components/
│   ├── Navbar.tsx            → U9: usuario, rol, cerrar sesión, enlaces según rol
│   ├── ProtectedRoute.tsx    → U9: sesión y rol
│   ├── *List.tsx / *Modal.tsx
│   └── ui/ (TablaDatos, Modal, Button, EstadoCarga, EstadoVacio, EstadoError, campos)
├── pages/
│   ├── LoginPage.tsx · RegisterPage.tsx · UnauthorizedPage.tsx   → U9
│   ├── AdminUsersPage.tsx                                          → U9
│   └── CategoriesPage.tsx · ProductsPage.tsx · IngredientsPage.tsx
├── columnas/ · hooks/ · utils/
└── index.css
```

### Decisiones de diseño (TP 9)

- **sessionStorage y no localStorage.** Se borra al cerrar la pestaña, así expone menos. La sesión real la mantiene la cookie, y `/auth/me` la restaura.
- **Se persiste lo mínimo.** De `/auth/me` se guardan solo `username`, `full_name`, `email` y `role`; ni `id` ni `disabled`. Igual son una copia: quien decide si la sesión vale es el backend.
- **`login()` del store propaga el error.** `LoginPage` lo captura y muestra "Credenciales incorrectas" o "Cuenta de usuario desactivada" **sin recargar**, gracias a `e.preventDefault()`.
- **La validación del registro está en las dos puntas.** El frontend avisa de entrada (usuario de 3 a 50 caracteres, email, contraseña de 8 caracteres a 72 bytes); el backend es el que decide (422 / 409).
- **`queryClient.clear()` al cerrar sesión.** Así el siguiente usuario no ve datos cacheados de la sesión anterior.
- **Rutas y páginas en inglés** (`/categories`, `CategoriesPage`), como pide la estructura de la consigna. En la U8 estaban en español.
- **Un admin no puede desactivarse a sí mismo** desde `AdminUsersPage`, para no quedarse afuera.

---

## De la Unidad 8

### Patrón de cada página

Las tres páginas tienen la misma estructura:

| Responsabilidad | Herramienta |
|---|---|
| Leer el listado | `useQuery` (`queryKey: ["categorias"]`) |
| Crear / editar / eliminar | `useMutation` + `invalidateQueries` al éxito |
| Formulario de alta y edición | `useForm` (TanStack Form), dentro de un modal |
| Modal abierto o cerrado | `useState<boolean>` |
| Ordenar y paginar | `useReactTable` con `getSortedRowModel` y `getPaginationRowModel` |
| Estados de carga, error y vacío | `EstadoCarga`, `EstadoError` y `EstadoVacio`, en ese orden |

La página arma `form` y `table`, y se los pasa por props a `CategoriaModal` y `CategoriaList`, que solo dibujan.

### Decisiones de diseño (U8)

- **Paginación en el navegador.** La HU-01 pide ordenar y paginar con TanStack Table, que trabaja sobre las filas que tiene el navegador. Por eso los services piden `?limit=100` (el máximo que acepta el backend) y la tabla ordena y pagina todo. Con paginación en el servidor, ordenar por nombre ordenaría solo los 10 registros de la página actual.
- **Columnas fuera de los componentes.** Así conservan la misma referencia entre renders, como pide la guía. Por eso los botones Editar y Eliminar están en `TablaDatos` y llegan como props, en lugar de ser columnas.
- **Alta y edición en el mismo modal.** El título y el botón cambian según `idEdicion`. Al editar, el formulario se precarga con `form.reset(valores, { keepDefaultValues: true })`. Sin esa opción, `reset` reemplaza los `defaultValues`, y en el siguiente render el formulario vuelve a quedar vacío.
- **Validación en las dos puntas.** Los `validators` de TanStack Form dan feedback inmediato: nombre obligatorio, precio no negativo, al menos una categoría, unidad obligatoria. La regla real la aplica el backend con 422 o 409. Los errores de la API se muestran **dentro del modal, sin cerrarlo** (HU-02).
- **Eliminar pide confirmación** (`window.confirm`). Si la API responde 409 (por ejemplo, una categoría con productos), el error se informa arriba de la tabla.
- **`form.Subscribe`** deshabilita el botón de guardar mientras el formulario es inválido, sin re-renderizar todo el formulario.
