import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { claseInput, claseLabel, ErrorApi, ErroresCampo } from "../components/ui/campos";
import { authService } from "../services/auth";
import { useAuthStore } from "../store/authStore";
import type { DatosRegistro } from "../types/auth.types";

const REGISTRO_VACIO: DatosRegistro = { username: "", full_name: "", email: "", password: "" };

// Validación básica de forma en el frontend (comodidad para el usuario).
// La validación real la hace el backend con EmailStr (RN-09 -> 422).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// bcrypt procesa hasta 72 BYTES: una letra con tilde ocupa 2 en UTF-8.
const bytes = (texto: string) => new TextEncoder().encode(texto).length;

// Definición de los 4 campos: así el JSX no repite el mismo bloque 4 veces.
const CAMPOS: {
  name: keyof DatosRegistro;
  label: string;
  type: string;
  autoComplete: string;
  validar: (valor: string) => string | undefined;
}[] = [
  {
    name: "username",
    label: "Usuario",
    type: "text",
    autoComplete: "username",
    validar: (v) =>
      v.trim().length < 3 ? "Mínimo 3 caracteres" : v.trim().length > 50 ? "Máximo 50 caracteres" : undefined,
  },
  {
    name: "full_name",
    label: "Nombre completo",
    type: "text",
    autoComplete: "name",
    validar: (v) => (!v.trim() ? "El nombre es obligatorio" : undefined),
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    autoComplete: "email",
    validar: (v) => (!EMAIL_REGEX.test(v.trim()) ? "Ingresá un email válido" : undefined),
  },
  {
    name: "password",
    label: "Contraseña",
    type: "password",
    autoComplete: "new-password",
    validar: (v) =>
      v.length < 8 ? "Mínimo 8 caracteres" : bytes(v) > 72 ? "Máximo 72 bytes" : undefined,
  },
];

function RegisterPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [errorApi, setErrorApi] = useState<string | null>(null);

  const form = useForm({
    defaultValues: REGISTRO_VACIO,
    onSubmit: async ({ value }) => {
      setErrorApi(null);
      try {
        await authService.registrar({
          username: value.username.trim(),
          full_name: value.full_name.trim(),
          email: value.email.trim(),
          password: value.password,
        });
        // HU-01: al completar el registro, redirige a /login (con aviso de éxito).
        navigate("/login", { replace: true, state: { registrado: true } });
      } catch (error) {
        // 409 usuario/email repetido, 422 datos inválidos: mensaje del backend.
        setErrorApi(error instanceof Error ? error.message : "No se pudo completar el registro");
      }
    },
  });

  if (user) return <Navigate to="/categories" replace />;

  return (
    <div className="mx-auto mt-12 max-w-sm rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h1 className="text-xl font-semibold text-slate-900">Crear cuenta</h1>
      <p className="mt-1 text-sm text-slate-500">Las cuentas nuevas tienen rol de usuario</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="mt-6 space-y-4"
        noValidate
      >
        {CAMPOS.map((campo, indice) => (
          <form.Field
            key={campo.name}
            name={campo.name}
            validators={{
              // onChange: avisa mientras escribe; onSubmit: revisa todo al enviar.
              onChange: ({ value }) => campo.validar(value),
              onSubmit: ({ value }) => campo.validar(value),
            }}
          >
            {(field) => (
              <div>
                <label htmlFor={field.name} className={claseLabel}>
                  {campo.label}
                </label>
                <input
                  id={field.name}
                  type={campo.type}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={field.state.meta.errors.length > 0}
                  autoComplete={campo.autoComplete}
                  autoFocus={indice === 0}
                  className={claseInput}
                />
                <ErroresCampo errores={field.state.meta.errors} />
              </div>
            )}
          </form.Field>
        ))}

        <ErrorApi mensaje={errorApi} />

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting} className="w-full">
              {isSubmitting ? "Creando cuenta…" : "Registrarme"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        ¿Ya tenés cuenta?{" "}
        <Link to="/login" className="font-medium text-brand hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </div>
  );
}

export default RegisterPage;
