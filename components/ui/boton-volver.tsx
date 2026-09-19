"use client";

import { useRouter } from "next/navigation";
import { ChevronCircle } from "@/components/ui/chevron-circle";
import { triggerTapHaptic } from "@/lib/haptics";
import { TAP_FEEDBACK_CLASS } from "@/lib/tap-feedback";

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
  destinoSiNoHayVuelta: string;
  etiqueta?: string;
  className?: string;
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
  etiqueta = "Volver",
  className = "",
}: BotonVolverProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label={etiqueta}
      onPointerDown={() => triggerTapHaptic()}
      onClick={() => {
        if (hayPantallaAnterior()) {
          router.back();
          return;
        }
        router.push(destinoSiNoHayVuelta);
      }}
      className={[
        TAP_FEEDBACK_CLASS,
        "flex h-14 w-14 shrink-0 items-center justify-center rounded-full",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ChevronCircle direction="left" />
    </button>
  );
}
