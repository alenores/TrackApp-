"use client";

import { BotonRedondo, clasesDeBotonRedondo } from "@/components/ui/boton-redondo";
import { Enlace } from "@/components/ui/enlace";
import { ICONO_DE_GOOGLE_MAPS } from "@/components/ui/iconos";
import { enlaceAGoogleMaps } from "@/lib/mapas/enlace-a-google";
import type { VistaDelMapa } from "@/lib/mapas/vista";

/** Un acceso externo del tamaño normal, sin mostrar coordenadas. */
export function EnlaceAGoogleMaps({ vista }: { vista: VistaDelMapa | null }) {
  const etiqueta = "Abrir esta zona en Google Maps";
  if (!vista) return (
    <BotonRedondo etiqueta="Google Maps: esperando que abra el mapa" disabled>
      {ICONO_DE_GOOGLE_MAPS}
    </BotonRedondo>
  );
  return (
    <Enlace href={enlaceAGoogleMaps(vista)} target="_blank" rel="noopener noreferrer"
      aria-label={etiqueta} title={etiqueta} className={clasesDeBotonRedondo()}>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {ICONO_DE_GOOGLE_MAPS}
      </svg>
    </Enlace>
  );
}
