import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { InsigniasDeActividad } from "@/components/rutas/insignias-de-actividad";
import { PROPORCION_DE_LA_PORTADA_DE_PERFIL } from "@/lib/fotos/preparar";
import type { ActividadRuta } from "@/types/database";

/**
 * La cabecera de un perfil. **La misma en tu perfil y en el de los demás.**
 *
 * La portada se ve entera, con la misma forma con que se recorta al subirla.
 * El avatar va mitad adentro y mitad afuera de la portada, sin aro y con una
 * sombra suave; el nombre, a su derecha, en la parte de afuera. Debajo, lo
 * que practica (decidido por Ale el 2026-10-04).
 */

type Props = {
  portadaUrl: string | null | undefined;
  avatarUrl: string | null | undefined;
  nombre: string;
  /** Una línea chica debajo del nombre, como la categoría. */
  detalle?: string;
  actividades: ActividadRuta[];
  /** Lo que va arriba a la derecha de la portada, como el botón de editar. */
  accion?: ReactNode;
};

export function PortadaDePerfil({ portadaUrl, avatarUrl, nombre, detalle, actividades, accion }: Props) {
  return (
    <div>
      <div
        className="relative w-full overflow-hidden bg-superficie-alta"
        style={{ aspectRatio: PROPORCION_DE_LA_PORTADA_DE_PERFIL }}
      >
        {portadaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- la foto ya viene achicada por el módulo de fotos.
          <img src={portadaUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        {accion ? <div className="absolute right-3 top-3 z-10">{accion}</div> : null}
      </div>

      <div className="relative px-4 pb-4 sm:px-5">
        <div className="absolute -top-10 left-4 flex rounded-full shadow-[var(--sombra-alta)] sm:left-5">
          <Avatar src={avatarUrl} name={nombre} size="lg" sinBorde />
        </div>
        {/* El nombre arranca donde termina el avatar: 80 de avatar más el margen. */}
        <div className="flex min-h-12 flex-col justify-center pl-24 pt-2">
          <p className="truncate text-lg font-bold leading-tight text-texto">{nombre}</p>
          {detalle ? <p className="text-sm font-medium text-texto-suave">{detalle}</p> : null}
        </div>
        {actividades.length > 0 ? (
          <div className="mt-3">
            <InsigniasDeActividad actividades={actividades} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
