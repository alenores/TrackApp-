"use client";

/**
 * Una opción chica para elegir adentro de un filtro, con la misma forma que
 * las insignias de actividad del perfil: prendida en verde, apagada en gris.
 */
export function Pastilla({ etiqueta, prendida, alTocar, rol = "checkbox" }: {
  etiqueta: string;
  prendida: boolean;
  alTocar: () => void;
  /** `radio` cuando se elige una sola entre varias. */
  rol?: "checkbox" | "radio";
}) {
  return (
    <button type="button" role={rol} aria-checked={prendida} onClick={alTocar}
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde",
        prendida ? "border-acento-borde bg-verde-fondo text-verde-texto" : "border-borde-fuerte bg-transparent text-texto-suave",
      ].join(" ")}>
      {etiqueta}
    </button>
  );
}
