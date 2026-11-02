# API Food Store: TP Unidad 9 (Programación IV)

API REST con **FastAPI + SQLModel + PostgreSQL**, ahora con un **módulo de seguridad**.

- **Nuevo en la U9:** autenticación con **JWT en una cookie HttpOnly**, gestión de usuarios y **autorización por roles** (`user` / `admin`) con `require_role`. Se demuestra en **`seguridad.http`**.
- **Del TP de la U8:** Pedidos y DetallePedido con Repository + Unit of Work (`pedidos.http`).
- **Del TP de la U7:** CRUD de Categorías, Productos e Ingredientes, y el catálogo de Unidades de Medida (`api.http`).

## Cómo ejecutarlo (Windows)

**1. Base de datos (PostgreSQL en WSL2).** Abrí una terminal de Ubuntu (`wsl`) y **dejala abierta** mientras uses la API:

```bash
sudo service postgresql start
sudo -u postgres createdb food_store        # solo la primera vez
```

**2. Backend.** En otra terminal, desde esta carpeta:

```cmd
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
copy .env.example .env
.venv\Scripts\python -m uvicorn app.main:app --reload
```

En el `.env` hay que completar:

| Variable | Qué poner |
|---|---|
| `DATABASE_URL` | La clave de PostgreSQL |
| `SECRET_KEY` | Una clave aleatoria de **al menos 32 caracteres**. Generarla con `.venv\Scripts\python -c "import secrets; print(secrets.token_urlsafe(48))"` |

Si falta alguna, la app **no arranca** (*fail-fast*): es preferible a que arranque con una clave conocida.

- API: http://localhost:8000
- Documentación interactiva (Swagger): http://localhost:8000/docs
- Al arrancar se crean las tablas y `seed.py` carga las unidades de medida y los **usuarios de prueba**.

> Se invoca el Python del `.venv` por su ruta en lugar de activarlo, porque la política de ejecución de PowerShell bloquea `Activate.ps1`.

### Usuarios de prueba (seed)

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin1234!` | admin |
| `juan` | `Juan1234!` | user |

El registro público siempre crea usuarios con rol `user` (RN-08). El seed es la única forma de tener un admin.

## Seguridad (TP 9)

### Defensa en profundidad: cuatro capas

| Capa | Dónde | Qué hace |
|---|---|---|
| **1. Secretos en el entorno** | `core/config.py` + `.env` | `SECRET_KEY` y la clave de la base se leen del `.env` (no se entrega). Sin valor por defecto. |
| **2. JWT en cookie HttpOnly** | `core/security.py` + `modules/usuarios/router.py` | El login firma un JWT (HS256, 30 min) y lo entrega en la cookie `access_token`. JavaScript no puede leerla. |
| **3. Dependencias y RBAC** | `core/deps.py` | Cada router y cada endpoint declara qué sesión y qué rol exige |
| **4. Hash de contraseñas** | `core/security.py` | bcrypt, lento y con sal. La contraseña nunca se guarda en texto plano (RN-01). |

### La cadena de dependencias (`core/deps.py`)

```
oauth2_scheme            → lee el token SOLO de la cookie         (sin cookie: 401)
  ↓                        (el encabezado Authorization no se acepta: RN-03)
get_current_user         → valida firma + vencimiento + tipo,      (inválido / vencido: 401)
  ↓                        y busca al usuario en la base
get_current_active_user  → ¿la cuenta está activa?                  (desactivada: 400)
  ↓
require_role([...])      → ¿el rol está permitido?                  (no: 403)
```

Para declararla en los routers hay tres atajos:

```python
SESION       = [Depends(get_current_active_user)]                # cualquier usuario logueado
SOLO_ADMIN   = [Depends(require_role(["admin"]))]                 # escrituras del catálogo
USER_O_ADMIN = [Depends(require_role(["user", "admin"]))]         # crear pedidos

router = APIRouter(prefix="/categorias", ..., dependencies=SESION)    # todo el router pide sesión
@router.post("/", ..., dependencies=SOLO_ADMIN)                        # y además, crear exige admin
```

### Matriz de permisos

| Recurso | Sin sesión | `user` | `admin` |
|---|---|---|---|
| `POST /api/v1/auth/register`, `/token`, `/logout` | ✅ | ✅ | ✅ |
| `GET /api/v1/auth/me` | 401 | ✅ | ✅ |
| `GET` categorías, productos, ingredientes, pedidos, unidades | 401 | ✅ | ✅ |
| `POST` / `PUT` / `DELETE` categorías, productos, ingredientes | 401 | **403** | ✅ |
| `POST /pedidos/` | 401 | ✅ (RN-05) | ✅ |
| `PUT` / `DELETE` pedidos | 401 | 403 | ✅ |
| Unidades de medida: escritura | — | — | **405**: el catálogo solo expone `GET` (RN-06) |
| `/api/v1/auth/admin/usuarios…` | 401 | 403 | ✅ |
| `GET /health/` | ✅ | ✅ | ✅ |

### Endpoints de autenticación (`/api/v1/auth`)

| Método | Ruta | Respuesta |
|---|---|---|
| POST | `/register` | 201 (rol `user`, sin contraseña) / 409 usuario o email repetido / 422 email inválido o contraseña de menos de 8 |
| POST | `/token` | Formulario OAuth2 (`username`, `password`) → 200 + `Set-Cookie: access_token=…; HttpOnly` / 401 credenciales incorrectas / 400 cuenta desactivada |
| POST | `/logout` | 200 + `Set-Cookie` que borra la cookie |
| GET | `/me` | 200 con el usuario / 401 |
| GET | `/admin/usuarios` | Solo admin |
| POST | `/admin/usuarios/{id}/desactivar` · `/activar` | Solo admin. Borrado lógico del usuario (`disabled`) / 404 |

### Decisiones de diseño (TP 9)

| Decisión | Justificación |
|---|---|
| El token va **solo** en la cookie HttpOnly, no en el cuerpo | Si JavaScript no puede leerlo, un XSS no lo puede robar |
| El backend **no acepta** `Authorization: Bearer` | Para mandarlo, el frontend tendría que poder leer el token. `seguridad.http`, paso 17, lo demuestra con un token válido. |
| `samesite="lax"` | Mitiga CSRF. `secure=False` solo en desarrollo; en producción, con HTTPS, va `True`. |
| CORS con `allow_credentials=True` y el origen explícito del `.env` | Sin credenciales, la cookie no viaja entre `:5173` y `:8000`. Con credenciales, no se admite `"*"`. |
| Mismo mensaje para usuario inexistente y contraseña incorrecta (401) | No revela qué usuarios existen. El registro sí responde 409: es un límite conocido. |
| El usuario se busca en la base **en cada pedido** | Si se desactiva una cuenta, el siguiente pedido responde 400 aunque el token siga vigente |
| `UserPublic` como `response_model` | Filtra `hashed_password`: el hash nunca sale del servidor |
| Contraseña de 8 caracteres a **72 bytes** | bcrypt procesa solo los primeros 72 bytes; una letra con tilde ocupa 2 |
| `python-jose` 3.5.0 y `bcrypt` 4.0.1 fijos | La 3.3.0 tiene CVE-2024-33663 y CVE-2024-33664. `passlib` 1.7.4 falla con bcrypt más nuevo. |
| Borrado lógico | Ya estaba en todos los modelos con `deleted_at` (U7 y U8). En `Usuario`, con `disabled` (RN-11). |
| Módulos dentro de `app/modules/` | Como pide la consigna. Se movieron también los módulos de la U7 y la U8, para mantener una estructura pareja. |
| El JWT no se revoca al hacer logout | Se borra la cookie, pero una copia del token seguiría valiendo hasta vencer. Por eso dura poco (30 min). |

## Estructura

```
app/
├── main.py                 # lifespan (tablas + seed), CORS con credenciales, routers
├── seed.py                 # unidades de medida + usuarios admin y juan (idempotente)
├── core/
│   ├── config.py           # Settings: DATABASE_URL, SECRET_KEY (≥ 32), JWT (lee .env)
│   ├── security.py         # U9: hash_password / verify_password (bcrypt) + JWT
│   ├── deps.py             # U9: get_current_user, get_current_active_user, require_role
│   ├── database.py         # engine, SessionDep, session_factory() para los UoW
│   ├── repository.py       # BaseRepository[T]  (U8)
│   ├── unit_of_work.py     # UnitOfWork base    (U8)
│   ├── audit.py · pagination.py · params.py · validators.py
└── modules/
    ├── usuarios/           # U9: model, schema, repository, unit_of_work, service, router
    ├── pedido/             # U8: Repository + Unit of Work
    ├── categoria/ · producto/ · ingrediente/ · unidad_medida/ · health/   # U7
```

## Demostración

| Archivo | Qué demuestra |
|---|---|
| **`seguridad.http`** (U9) | 24 pruebas en orden: registro, login, cookie, 401 / 403 / 400 / 405, roles, desactivación, logout |
| `pedidos.http` (U8) | Pedidos, validaciones y atomicidad (rollback). Empieza con un login de admin. |
| `api.http` (U7) | CRUD del catálogo. Empieza con un login de admin. |

Se ejecutan con la extensión **REST Client** de VS Code, que guarda la cookie del login igual que un navegador.

---

## Del TP de la Unidad 8

### Decisiones de diseño: Pedidos

| Decisión | Justificación |
|---|---|
| **PK compuesta** `(pedido_id, producto_id)` en `detalle_pedido` | Es la del diagrama UML. La base misma impide que un producto se repita en un pedido. |
| Producto repetido validado en `PedidoCreate` (422) | Sin esa validación, la PK compuesta rechazaría el segundo detalle con un `IntegrityError` y el cliente recibiría un 500. |
| `estado` guardado como texto y validado con un `Enum` en el schema | La consigna pide texto. El `Enum` hace que cualquier valor fuera de PENDIENTE, CONFIRMADO, ENTREGADO o CANCELADO responda 422. |
| `precio_unitario` copiado del producto al crear el pedido | Es una foto del precio: si el producto aumenta, el pedido conserva el precio que se pagó. |
| `total` y `fecha` calculados por el backend | El cliente solo envía `producto_id` y `cantidad`. No puede alterar el total. |
| Borrado lógico con `deleted_at` | Un pedido eliminado no aparece en el listado y cualquier operación sobre él responde 404 (RN-13). |
| `ondelete`: CASCADE hacia el pedido y RESTRICT hacia el producto | Los detalles se van con su pedido, y un producto vendido no se puede borrar físicamente. |
| La conversión a `PedidoConDetalles` se hace **dentro** del `with` | Después del commit la sesión se cierra y el objeto ya no se puede leer (guía de la cátedra, sección 9). |
| `ProductoRepository` vive en `modules/pedido/` | El caso de uso necesita leer productos dentro de la misma transacción. Producto no se migró a Repository/UoW, porque es opcional en la consigna. |

### Decisiones de diseño: TP de la U7 (resumen)

- **Borrado lógico** con `deleted_at` en todas las entidades.
- **Nombre único solo entre activos**, sin distinguir mayúsculas (RN-02, 409), validado en el service.
- `precio_base` como `float`: Pydantic serializa `Decimal` como texto, lo que rompería el tipo `number` del frontend.
- La **primera** categoría de `categoria_ids` es la principal (`es_principal` del diagrama). El frontend la marca con ★.
- No se elimina una categoría o un ingrediente usado por productos activos (409).

### Endpoints de Pedidos

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/pedidos/` | 200, pedidos no eliminados (sin detalles) |
| GET | `/pedidos/{id}` | 200 con detalles / 404 |
| POST | `/pedidos/` | 201 / 422 (sin detalles, cantidad < 1, producto repetido) / 404 (producto inexistente, sin guardar nada) |
| PUT | `/pedidos/{id}` | 200 / 422 (estado inválido) / 404 |
| DELETE | `/pedidos/{id}` | 204 (borrado lógico) / 404 |

Body del POST:

```json
{ "detalles": [ { "producto_id": 1, "cantidad": 2 }, { "producto_id": 2, "cantidad": 1 } ] }
```

Los endpoints de Categorías, Productos, Ingredientes y Unidades de Medida no cambiaron respecto de la U7. Se pueden ver en `/docs` y en `api.http`.

### Demostración de pedidos

Abrir **`pedidos.http`** y ejecutar primero el **login de admin** que está al principio (TP 9), y después los bloques en orden:

0. Preparación: una categoría y dos productos
1. Crear pedido → 201 (total calculado: 3500.50)
2. Errores de validación → 422 (sin detalles, cantidad 0, producto repetido)
3. **Atomicidad**: producto inexistente → 404, y el listado muestra la misma cantidad de pedidos que antes (rollback)
4. Leer → 200 / 404
5. Actualizar estado → 200 / 422 / 404
6. Borrado lógico → 204, y después 404 en GET, PUT y DELETE
