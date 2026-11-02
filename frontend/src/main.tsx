import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

// El QueryClient es la caché global del server state.
// Se crea FUERA de cualquier componente: si se creara adentro, cada render
// fabricaría una caché nueva y vacía, y se perdería todo lo guardado.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // por defecto reintenta 3 veces: el error tardaría en mostrarse
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Provider de TanStack: da acceso a la caché a todo el árbol */}
    <QueryClientProvider client={queryClient}>
      {/* Provider de React Router: habilita rutas, <Link> y useNavigate */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);