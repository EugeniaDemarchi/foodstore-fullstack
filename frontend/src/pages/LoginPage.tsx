import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { claseInput, claseLabel, ErrorApi, ErroresCampo } from "../components/ui/campos";
import { useAuthStore } from "../store/authStore";
import type { CredencialesLogin } from "../types/auth.types";

const CREDENCIALES_VACIAS: CredencialesLogin = { username: "", password: "" };

// RegisterPage navega a /login con este state para mostrar el aviso de éxito.
interface EstadoNavegacion {
  registrado?: boolean;
}

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const registrado = (location.state as EstadoNavegacion | null)?.registrado === true;

  // Selectores: el componente solo se actualiza si cambian user o login.
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);

  // Error del backend (401 credenciales incorrectas, 400 cuenta desactivada).
  const [errorApi, setErrorApi] = useState<string | null>(null);

  const form = useForm({
    defaultValues: CREDENCIALES_VACIAS,
    // onSubmit async: mientras espera, form.state.isSubmitting es true.
    onSubmit: async ({ value }) => {
      setErrorApi(null);
      try {
        await login({ username: value.username.trim(), password: value.password });
        navigate("/categories", { replace: true }); // HU-02: tras el login, a /categories
      } catch (error) {
        // HU-02: credenciales inválidas -> mensaje SIN recargar la página.
        setErrorApi(error instanceof Error ? error.message : "No se pudo iniciar sesión");
      }
    },
  });

  // Si ya hay sesión, no tiene sentido mostrar el login.
  if (user) return <Navigate to="/categories" replace />;

  return (
    <div className="mx-auto mt-12 max-w-sm rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h1 className="text-xl font-semibold text-slate-900">Iniciar sesión</h1>
      <p className="mt-1 text-sm text-slate-500">Ingresá con tu usuario de Food Store</p>

      {registrado && (
        <p role="status" className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-success">
          Cuenta creada. Ya podés iniciar sesión.
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault(); // evita que el navegador recargue la página
          form.handleSubmit();
        }}
        className="mt-6 space-y-4"
        noValidate
      >
        <form.Field
          name="username"
          validators={{
            onChange: ({ value }) => (!value.trim() ? "Ingresá tu usuario" : undefined),
          }}
        >
          {(field) => (
            <div>
              <label htmlFor={field.name} className={claseLabel}>
                Usuario
              </label>
              <input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={field.state.meta.errors.length > 0}
                autoComplete="username"
                autoFocus
                className={claseInput}
              />
              <ErroresCampo errores={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <form.Field
          name="password"
          validators={{
            onChange: ({ value }) => (!value ? "Ingresá tu contraseña" : undefined),
          }}
        >
          {(field) => (
            <div>
              <label htmlFor={field.name} className={claseLabel}>
                Contraseña
              </label>
              <input
                id={field.name}
                type="password"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={field.state.meta.errors.length > 0}
                autoComplete="current-password"
                className={claseInput}
              />
              <ErroresCampo errores={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <ErrorApi mensaje={errorApi} />

        {/* Solo el botón se re-renderiza cuando cambia el estado del envío */}
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting} className="w-full">
              {isSubmitting ? "Ingresando…" : "Ingresar"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        ¿No tenés cuenta?{" "}
        <Link to="/register" className="font-medium text-brand hover:underline">
          Registrate
        </Link>
      </p>
    </div>
  );
}

export default LoginPage;
