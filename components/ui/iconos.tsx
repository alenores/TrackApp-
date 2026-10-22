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

/** Google Maps: un alfiler con la G, distinto del ícono de Punto. */
export const ICONO_DE_GOOGLE_MAPS = <>
  <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
  <path d="M14.5 7.5A3.5 3.5 0 1 0 15 12V10h-3" />
</>;

/** Editar algo que ya está: un lápiz sobre una línea. No es el de Marcas. */
export const ICONO_DE_EDITAR = <>
  <path d="M4 20h10" />
  <path d="M13.5 5.5 17 9 8 18H4.5V14.5L13.5 5.5Z" />
</>;

/** Eliminar: un tacho. */
export const ICONO_DE_ELIMINAR = <>
  <path d="M4 7h16" />
  <path d="M9 7V5h6v2" />
  <path d="M7 7l1 12h8l1-12" />
</>;

/** Circuitos: una línea que sube y baja hasta llegar. */
export const ICONO_DE_CIRCUITOS = <path d="M3 18 8 8l5 5 8-9M3 18h5m5-5h4" />;

/**
 * Ubicarme y centrar en mi ubicación: una mira. El botón no cambia de fondo.
 * El dibujo va del mismo azul que el punto del GPS, amarillo cuando esa
 * posición quedó vieja, y rojo cuando el GPS falló. Con el GPS andando el
 * centro va lleno. No se parece al alfiler de Punto a propósito.
 */
export function iconoDeUbicarme(
  prendido: boolean,
  tono: "bien" | "viejo" | "fallo" = "bien",
) {
  const color = tono === "fallo" ? "var(--rojo)" : tono === "viejo" ? "var(--ambar-icono)" : "var(--gps)";
  return <>
    <circle cx="12" cy="12" r="7" stroke={color} />
    <circle cx="12" cy="12" r="2" fill={prendido ? color : "none"} stroke={color} />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke={color} />
  </>;
}

/** Marcar acá en la salida que se está registrando: un señalador. */
export const ICONO_DE_MARCAR_ACA = <path d="M7 3h10v18l-5-4-5 4Z" />;

/** Cuánto sube un Circuito: una flecha en diagonal hacia arriba. */
export const ICONO_DE_SUBE = <path d="M7 17 17 7M9 7h8v8" />;

/** Cuánto baja un Circuito: una flecha en diagonal hacia abajo. */
export const ICONO_DE_BAJA = <path d="M7 7l10 10M17 9v8H9" />;

/*
 * Editar la línea de un Camino. Van como trazo suelto porque los dibuja
 * `Opciones`. Mockup aprobado por Ale el 2026-10-14.
 */

/** Mover puntos de una línea: cuatro flechas en cruz. */
export const TRAZO_DE_MOVER_PUNTOS = "M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3";

/** Agregar un punto a una línea: la línea con un punto y un «+» chico. */
export const TRAZO_DE_AGREGAR_PUNTO = "M3 17 9 11l4 4 8-8M9 13a2 2 0 1 0 4 0a2 2 0 1 0-4 0M18 15v6M15 18h6";

/** Quitar un punto de una línea: la línea con un punto y un «−» chico. */
export const TRAZO_DE_QUITAR_PUNTO = "M3 17 9 11l4 4 8-8M9 13a2 2 0 1 0 4 0a2 2 0 1 0-4 0M15 18h6";

/** Deshacer el último punto: una flecha que vuelve. */
export const TRAZO_DE_DESHACER = "M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3";

/** Volver a dibujar desde cero: una flecha en círculo. */
export const TRAZO_DE_VOLVER_A_DIBUJAR = "M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4";

/** Ayuda: un signo de pregunta en un círculo. Muestra lo que explica una pantalla. */
export const ICONO_DE_AYUDA = <>
  <circle cx="12" cy="12" r="9" />
  <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5V14M12 17h.01" />
</>;

/** Información de un Circuito, al navegarlo: una «i» en un círculo. */
export const ICONO_DE_INFORMACION = <>
  <circle cx="12" cy="12" r="9" />
  <path d="M12 11v6M12 8h.01" />
</>;
