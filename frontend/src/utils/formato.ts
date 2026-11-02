// Se crea UNA vez (crear un Intl.NumberFormat en cada render es costoso).
const formatoPesos = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});

export const formatearPrecio = (valor: number): string =>
  formatoPesos.format(valor);
