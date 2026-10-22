import catalogo from "./catalogo-de-actividades.json";
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

export const ACTIVIDADES = catalogo as ActividadMostrada[];

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
