import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { PROPORCION_DE_LA_PORTADA_DE_PERFIL } from "@/lib/fotos/preparar";

/**
 * La portada de un perfil con el avatar adentro, abajo a la izquierda. **La
 * misma en tu perfil y en el de los demás.**
 *
 * La portada se ve entera, con la misma forma con que se recorta al subirla:
 * lo que se elige es lo que se ve. El avatar va sin aro, con una sombra
 * suave, y un oscurecido abajo lo despega aunque la foto sea clara (decidido
 * por Ale el 2026-10-04).
 */

type Props = {
  portadaUrl: string | null | undefined;
  avatarUrl: string | null | undefined;
  nombre: string;
  /** Lo que va arriba a la derecha, como el botón de editar. */
  accion?: ReactNode;
};

export function PortadaDePerfil({ portadaUrl, avatarUrl, nombre, accion }: Props) {
  return (
    <div
      className="relative w-full overflow-hidden bg-superficie-alta"
      style={{ aspectRatio: PROPORCION_DE_LA_PORTADA_DE_PERFIL }}
    >
      {portadaUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- la foto ya viene achicada por el módulo de fotos.
        <img src={portadaUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}

      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-sobre-foto-degrade/45 to-transparent"
      />

      {accion ? <div className="absolute right-3 top-3 z-10">{accion}</div> : null}

      <div className="absolute bottom-3 left-4 flex rounded-full shadow-[var(--sombra-alta)]">
        <Avatar src={avatarUrl} name={nombre} size="lg" sinBorde />
      </div>
    </div>
  );
}
