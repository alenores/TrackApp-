"use client";

import { useRouter } from "next/navigation";
import { BotonRedondo } from "@/components/ui/boton-redondo";

/**
 * **El botón de volver vuelve, no va.**
 *
 * Volver rearma una pantalla que el navegador ya tiene dibujada. Ir a una
 * dirección obliga a armarla de nuevo, y sin señal eso termina en pantalla en
 * blanco. Es la lección que costó cara en Vías de Escalada.
 *
 * Cuando no hay adónde volver —el usuario abrió la app directo en esta
 * pantalla— recién ahí se va al destino de respaldo.
 */

type BotonVolverProps = {
  /** Adónde ir cuando no hay pantalla anterior. */
  destinoSiNoHayVuelta?: string;
  /** Para vistas que vuelven dentro de la misma pantalla. */
  alVolver?: () => void;
  etiqueta?: string;
  className?: string;
  disabled?: boolean;
};

function hayPantallaAnterior(): boolean {
  try {
    const estado = window.history.state as { idx?: number } | null;
    if (typeof estado?.idx === "number") return estado.idx > 0;
    return window.history.length > 1;
  } catch {
    return false;
  }
}

export function BotonVolver({
  destinoSiNoHayVuelta,
  alVolver,
  etiqueta = "Volver",
  className = "",
  disabled = false,
}: BotonVolverProps) {
  const router = useRouter();

  return (
    <BotonRedondo
      etiqueta={etiqueta}
      className={className}
      disabled={disabled}
      onClick={() => {
        if (alVolver) { alVolver(); return; }
        if (hayPantallaAnterior()) {
          router.back();
          return;
        }
        if (destinoSiNoHayVuelta) router.push(destinoSiNoHayVuelta);
      }}
    >
      <path d="M19 12H5m7-7-7 7 7 7" />
    </BotonRedondo>
  );
}
