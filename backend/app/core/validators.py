def texto_obligatorio(valor: str) -> str:
    """Quita espacios de los extremos y rechaza el texto si queda vacío.
    Se usa para RN-01 (categoría) y RN-06 (producto)."""
    limpio = valor.strip()
    if not limpio:
        raise ValueError("no puede estar vacío ni contener solo espacios")
    return limpio