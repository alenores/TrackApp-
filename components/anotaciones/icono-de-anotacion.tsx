import { colorDelIcono } from "@/lib/anotaciones/colores-de-icono";
import { COMO_SE_LLAMA } from "@/lib/anotaciones/iconos";
import { nombreDelColor } from "@/lib/anotaciones/colores-de-trazo";
import type { Anotacion, IconoPunto } from "@/types/database";

/**
 * Cómo se ve una anotación en una lista: el dibujo de su ícono si es un punto,
 * o una rayita de su color si es un trazo. **Es la única de la app**: así un
 * arroyo se ve igual en todas las listas.
 */

export const TRAZOS_DEL_ICONO: Record<IconoPunto, string> = {
  // Camita: el dibujo típico de alojamiento.
  refugio: "M3 7v11M3 11h10v7M13 11h7a1 1 0 0 1 1 1v6M3 18h18M5 11V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3",
  cumbre: "M8 14l4-8 4 8M4 20h16",
  pueblo: "M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 7h6M9 11h6M9 15h6",
  fuente: "M12 22a8 8 0 0 0 8-8c0-4-8-12-8-12S4 10 4 14a8 8 0 0 0 8 8z",
  mirador: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  iglesia: "M12 3v8M9 6h6M8 21V11l4-3 4 3v10z",
  arroyo: "M2 12 Q 7 5 12 12 T 22 12",
  cascada: "M7 3v3M7 9v3M7 15v3M12 3v3M12 9v3M12 15v3M17 3v3M17 9v3M17 15v3",
  puente: "M3 18 Q 12 4 21 18M3 18h18",
  cartel: "M5 4h14v8H5zM12 12v8",
  cruce: "M12 21v-8M12 13 5 4M12 13l7-9",
  // Mismo dibujo que el cruce; el color azul lo marca como juntura de agua.
  juntura: "M12 21v-8M12 13 5 4M12 13l7-9",
  tranquera: "M4 4v16M20 4v16M4 12h16M4 8l16 8",
  estacionamiento: "M7 20V4h6a4 4 0 0 1 0 8H7",
  sitio: "M12 21s-6-4.5-6-9a6 6 0 0 1 12 0c0 4.5-6 9-6 9zM14 11.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0",
  // Una carpa con su puerta: el mismo dibujo que los campings del mapa.
  campamento: "M12 4 3 20h18L12 4ZM12 11l-3 9M12 11l3 9",
  // Con chimenea y ventana, para no confundirla con el refugio (camita).
  casa: "M3 12l9-8 9 8M5 10v10h14V10M16 7V3h2v6M10 13h4v4h-4z",
  // Laguna y lago: el mismo óvalo de agua; se distinguen por el nombre.
  laguna: "M3 13c1.5-3.5 5-6 9-6s7.5 2.5 9 6c-1.5 3.5-5 6-9 6s-7.5-2.5-9-6z",
  lago: "M3 13c1.5-3.5 5-6 9-6s7.5 2.5 9 6c-1.5 3.5-5 6-9 6s-7.5-2.5-9-6z",
  // Hombrecito escalando una pared.
  escalada: "M10 4.5a1.5 1.5 0 1 0 .01 0M10 6l1.5 5.5M10 8l-3.5-1.5M10 8l4-2.5M11.5 11.5 8 19M11.5 11.5 16 17.5M18 3v18",
  posible_escalada: "M10 4.5a1.5 1.5 0 1 0 .01 0M10 6l1.5 5.5M10 8l-3.5-1.5M10 8l4-2.5M11.5 11.5 8 19M11.5 11.5 16 17.5M18 3v18",
  // Valle en V: dos paredes de la quebrada.
  quebrada: "M3 5l6 15M21 5l-6 15M9 20h6",
  // Cajita.
  objeto: "M5 8h14v11H5zM5 12h14M9 8V5h6v3",
};

/** Un alambrado traído de OpenStreetMap: postes y dos hilos. */
const TRAZO_DE_ALAMBRADO = "M4 4v16M20 4v16M4 8h16M4 16h16";

/** El nombre de lo que es: «Arroyo», «Trazo naranja». */
export function queEs(anotacion: Anotacion): string {
  if (anotacion.tipo === "trazo") return `Trazo ${nombreDelColor(anotacion.color).toLowerCase()}`;
  return COMO_SE_LLAMA[anotacion.icono ?? "cruce"];
}

/** De dónde salió, en palabras. */
export function deDondeSalio(anotacion: Anotacion): string {
  if (anotacion.origen === "google_earth") return "Desde Google Earth";
  if (anotacion.origen === "openstreetmap") return "Desde OpenStreetMap";
  if (anotacion.origen === "navegacion") {
    return anotacion.deAdministrador ? "Marcada navegando · administrador" : "Marcada navegando · usuario";
  }
  return anotacion.tipo === "punto" ? "Marcado a mano" : "Dibujado a mano";
}

export function IconoDeAnotacion({ anotacion }: { anotacion: Anotacion }) {
  if (anotacion.tipo === "trazo" && anotacion.origen !== "openstreetmap") {
    return (
      <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-superficie-alta">
        <span
          className="h-1.5 w-6 rounded-full"
          // El color del trazo es un dato de la anotación, no del tema.
          style={{ backgroundColor: anotacion.color ?? undefined }}
        />
      </span>
    );
  }

  const trazo =
    anotacion.tipo === "trazo" ? TRAZO_DE_ALAMBRADO : TRAZOS_DEL_ICONO[anotacion.icono ?? "cruce"];
  const colores = colorDelIcono(anotacion.tipo === "punto" ? anotacion.icono : null);

  return (
    <span
      aria-hidden
      // Atención: el mismo contorno rojo que en el mapa (decisión 078).
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${anotacion.atencion ? "ring-2 ring-rojo" : ""}`}
      style={{ backgroundColor: colores.fondo, color: colores.trazo }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d={trazo} />
      </svg>
    </span>
  );
}
