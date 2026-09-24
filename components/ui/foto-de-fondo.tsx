import Image from "next/image";

/**
 * La foto que va detrás de una lista.
 *
 * Cuánto se ve y el degradé salen de las variables de cada modo: con sol la
 * foto va casi entera, de noche solo se asoma. Es decoración, así que no tiene
 * texto alternativo y no se puede tocar.
 */

type FotoDeFondoProps = {
  src: string;
};

export function FotoDeFondo({ src }: FotoDeFondoProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <Image
        src={src}
        alt=""
        fill
        priority
        className="origin-[center_80%] scale-[1.3] object-cover object-[center_80%] opacity-[var(--foto-de-fondo-opacidad)]"
      />
      <div className="absolute inset-0 [background:var(--foto-de-fondo-degrade)]" />
    </div>
  );
}
