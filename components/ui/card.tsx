import type { ReactNode } from "react";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";

/**
 * La tarjeta: el bloque con el que está armada toda la app.
 *
 * Es lo que deja distinguir un grupo de datos de otro de un vistazo. El borde,
 * la sombra y el fondo no son adorno: sin ellos la pantalla queda como una
 * catarata de datos todos iguales.
 *
 * **Ningún color se escribe acá a mano.** Todos salen de las variables, así la
 * tarjeta se ve igual de bien en modo sol y en modo noche.
 */

/** La franja de color al costado izquierdo, cuando la tarjeta es un aviso. */
export type FranjaDeTarjeta = "verde" | "ambar" | "rojo";

const FRANJAS: Record<FranjaDeTarjeta, string> = {
  verde: "border-l-4 border-l-verde-borde",
  ambar: "border-l-4 border-l-ambar-borde",
  rojo: "border-l-4 border-l-rojo-borde",
};

type CardProps = {
  children: ReactNode;
  className?: string;
  /** Destaca la tarjeta como aviso, con una franja de color al costado. */
  franja?: FranjaDeTarjeta;
  /** `alta` para una tarjeta que va adentro de otra y necesita despegarse. */
  tono?: "normal" | "alta";
  /** `true` cuando toda la tarjeta se toca y lleva a otra pantalla. */
  interactiva?: boolean;
};

export function Card({
  children,
  className = "",
  franja,
  tono = "normal",
  interactiva = false,
}: CardProps) {
  return (
    <section
      className={[
        "rounded-2xl border border-borde px-4 py-4 shadow-[var(--sombra)]",
        tono === "alta" ? "bg-superficie-alta" : "bg-superficie",
        franja ? FRANJAS[franja] : "",
        interactiva
          ? [
              CLASE_DE_RESPUESTA_AL_TOQUE,
              "cursor-pointer shadow-[var(--sombra-alta)] hover:border-acento-borde",
            ].join(" ")
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}
