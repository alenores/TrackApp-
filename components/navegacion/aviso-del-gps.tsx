"use client";

import { BotonCerrar, BotonRedondo } from "@/components/ui/boton-redondo";
import { iconoDeUbicarme } from "@/components/ui/iconos";
import type { Gps } from "@/hooks/use-gps";
import { useCerrarConAtras } from "@/hooks/use-cerrar-con-atras";
import { etiquetaDeLaMira, tonoDeLaMira } from "@/lib/navegacion/gps";

/**
 * La mira del GPS en los mapas del cerro. Azul si anda, amarilla si la
 * posición envejeció, roja si falló. Tocándola en rojo se lee qué pasó.
 */
export function BotonDelGps({
  gps,
  alCentrar,
  disabled = false,
}: {
  gps: Gps;
  alCentrar: () => void;
  disabled?: boolean;
}) {
  const tono = tonoDeLaMira(gps.estado, gps.posicionVieja);
  const falla = tono === "fallo";
  if (gps.estado !== "andando" && !gps.error) return null;

  return (
    <BotonRedondo
      etiqueta={etiquetaDeLaMira(tono)}
      disabled={disabled}
      onClick={() => {
        if (falla) {
          gps.mostrarElCartel();
          return;
        }
        alCentrar();
      }}
    >
      {iconoDeUbicarme(true, tono)}
    </BotonRedondo>
  );
}

/**
 * El texto de la falla, el mismo de siempre, con cruz para cerrarlo.
 * El atrás del celular y Escape cierran este cartel y no salen del mapa.
 */
export function CartelDeFallaDelGps({ gps, className = "" }: { gps: Gps; className?: string }) {
  const visible = gps.cartelAbierto && gps.error !== null;
  useCerrarConAtras(visible, gps.ocultarElCartel);
  if (!visible || !gps.error) return null;

  return (
    <div className={className}>
      <div
        role="alert"
        className="pointer-events-auto flex items-start gap-2 rounded-xl border border-rojo-borde bg-superficie p-2 text-lg leading-7 text-rojo-texto"
      >
        <p className="min-w-0 flex-1">{gps.error}</p>
        <BotonCerrar etiqueta="Cerrar el aviso del GPS" onClick={gps.ocultarElCartel} />
      </div>
    </div>
  );
}
