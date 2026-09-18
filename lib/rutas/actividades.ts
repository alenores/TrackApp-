import type { ActividadRuta, NivelEsfuerzo } from "@/types/database";

/**
 * Cómo se muestran las actividades y el nivel de esfuerzo.
 *
 * Los íconos son dibujos, no emoji: un emoji no respeta el contraste ni el
 * tamaño que pide la app, y con sol de frente se pierde.
 */

export type ActividadMostrada = {
  tipo: ActividadRuta;
  etiqueta: string;
  /** Trazo del ícono, para dibujar dentro de un `<svg viewBox="0 0 24 24">`. */
  trazo: string;
};

export const ACTIVIDADES: ActividadMostrada[] = [
  {
    tipo: "trekking",
    etiqueta: "Trekking",
    trazo:
      "M13.5 5.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM11 21l1.5-6.5L9.5 12 8 16m4.5-1.5L16 17l1 4M7 9l3.5-2 3 1.5L17 11",
  },
  {
    tipo: "mountain_bike",
    etiqueta: "Mountain bike",
    trazo:
      "M5.5 19a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm13 0a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5.5 15.5h5l3-7m-3 0h3.5m1 0 2.5 7M9 5h2.5",
  },
  {
    tipo: "kayak",
    etiqueta: "Kayak",
    trazo:
      "M3 4.5 21 19.5M21 4.5 3 19.5M6.5 8.5l11 7M6.5 15.5l11-7",
  },
  {
    tipo: "canyoning",
    etiqueta: "Canyoning",
    trazo:
      "M12 3v9m0 0-3.5 9M12 12l3.5 9M6 7h12M9.5 5.5 12 3l2.5 2.5",
  },
];

export function mostrarActividad(tipo: ActividadRuta): ActividadMostrada {
  return (
    ACTIVIDADES.find((actividad) => actividad.tipo === tipo) ?? {
      tipo,
      etiqueta: tipo,
      trazo: "M12 6v12M6 12h12",
    }
  );
}

const ETIQUETAS_DE_ESFUERZO: Record<NivelEsfuerzo, string> = {
  bajo: "Bajo",
  medio: "Medio",
  alto: "Alto",
  muy_alto: "Muy alto",
};

export function mostrarEsfuerzo(nivel: NivelEsfuerzo): string {
  return ETIQUETAS_DE_ESFUERZO[nivel];
}

/** «14,2 km». Coma decimal, que es como se escribe acá. */
export function mostrarLargo(largoKm: number | null): string {
  if (largoKm === null) return "—";
  return `${largoKm.toFixed(1).replace(".", ",")} km`;
}

/** «+820 m» y «−640 m», con el signo menos de verdad y no un guion. */
export function mostrarDesnivel(
  metros: number | null,
  sentido: "positivo" | "negativo",
): string {
  if (metros === null) return "—";
  return `${sentido === "positivo" ? "+" : "−"}${metros} m`;
}
