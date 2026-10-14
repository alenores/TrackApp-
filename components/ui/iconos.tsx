/**
 * Los íconos que le dan identidad a un módulo o a una función.
 *
 * **Un ícono, una sola cosa; una cosa, un solo ícono.** Si dos funciones
 * distintas comparten dibujo, el usuario no sabe qué toca; si una misma cosa
 * cambia de dibujo según la pantalla, no la reconoce. Decisión de Ale del
 * 2026-10-13. Por eso viven acá y cada pantalla los toma de este lugar.
 *
 * Son trazos para un `<svg viewBox="0 0 24 24">` con `stroke="currentColor"`.
 */

/** Marcas: lo dibujado sobre el mapa. Un lápiz. */
export const ICONO_DE_MARCAS = <path d="M4 20l1-4L16 5l3 3L8 19l-4 1ZM14 7l3 3" />;

/** Circuitos: una línea que sube y baja hasta llegar. */
export const ICONO_DE_CIRCUITOS = <path d="M3 18 8 8l5 5 8-9M3 18h5m5-5h4" />;

/**
 * Ubicarme y centrar en mi ubicación: una mira. Con el GPS andando el centro
 * va lleno. No se parece al alfiler de Punto a propósito.
 */
export function iconoDeUbicarme(prendido: boolean) {
  return <>
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="2" fill={prendido ? "currentColor" : "none"} />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </>;
}

/** Marcar acá en la salida que se está registrando: un señalador. */
export const ICONO_DE_MARCAR_ACA = <path d="M7 3h10v18l-5-4-5 4Z" />;

/** Cuánto sube un Circuito: una flecha en diagonal hacia arriba. */
export const ICONO_DE_SUBE = <path d="M7 17 17 7M9 7h8v8" />;

/** Cuánto baja un Circuito: una flecha en diagonal hacia abajo. */
export const ICONO_DE_BAJA = <path d="M7 7l10 10M17 9v8H9" />;

/** Ayuda: un signo de pregunta en un círculo. Muestra lo que explica una pantalla. */
export const ICONO_DE_AYUDA = <>
  <circle cx="12" cy="12" r="9" />
  <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17h.01" />
</>;
