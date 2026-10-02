import { COMO_SE_LLAMA } from "@/lib/anotaciones/iconos";
import { nombreDelColor } from "@/lib/anotaciones/colores-de-trazo";
import type { Anotacion, IconoPunto } from "@/types/database";

/**
 * Cómo se ve una anotación en una lista: el dibujo de su ícono si es un punto,
 * o una rayita de su color si es un trazo. **Es la única de la app**: así un
 * arroyo se ve igual en todas las listas.
 */

const TRAZOS_DEL_ICONO: Record<IconoPunto, string> = {
  refugio: "M3 12l9-8 9 8M5 10v10h14V10M9 20v-6h6v6",
  cumbre: "M8 14l4-8 4 8M4 20h16",
  pueblo: "M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 7h6M9 11h6M9 15h6",
  fuente: "M12 22a8 8 0 0 0 8-8c0-4-8-12-8-12S4 10 4 14a8 8 0 0 0 8 8z",
  mirador: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z",
  iglesia: "M12 3v8M9 6h6M8 21V11l4-3 4 3v10z",
  arroyo: "M2 12 Q 7 5 12 12 T 22 12",
  cascada: "M7 3v3M7 9v3M7 15v3M12 3v3M12 9v3M12 15v3M17 3v3M17 9v3M17 15v3",
  puente: "M3 18 Q 12 4 21 18M3 18h18",
  cartel: "M5 4h14v8H5zM12 12v8",
  cruce: "M6 6l12 12M18 6L6 18",
  tranquera: "M4 4v16M20 4v16M4 12h16M4 8l16 8",
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

  return (
    <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-verde-fondo text-verde-texto">
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
