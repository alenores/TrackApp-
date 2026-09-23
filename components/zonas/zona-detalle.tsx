"use client";

import { useRouter } from "next/navigation";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { usePuedeAdministrar } from "@/hooks/use-puede-administrar";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { TarjetaDeSector } from "@/components/zonas/tarjeta-de-sector";
import { BotonVolver } from "@/components/ui/boton-volver";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { sectoresEnElMapa } from "@/lib/mapas/rectangulos";
import { mostrarTamano } from "@/lib/territorio/tamano";
import type { Rectangulo } from "@/types/database";
import { useRutasEnArea } from "@/hooks/use-rutas-en-area";
import { SelectorDeRutasEnMapa } from "@/components/zonas/selector-de-rutas-en-mapa";

/**
 * Una zona con sus sectores.
 *
 * Lo que importa acá no es la lista: es **cuánto de la zona todavía no tiene
 * sector encima**. Ese hueco es lo que después deja una ruta sin mapa, y se
 * tiene que ver en casa, no en el cerro.
 */

type ZonaDetalleProps = {
  zonaId: number;
  miPerfilId: string | null;
};

export function ZonaDetalle({ zonaId, miPerfilId }: ZonaDetalleProps) {
  const router = useRouter();
  const { paquete, estado } = useDatosDeLaApp();
  const puedeAdministrar = usePuedeAdministrar(miPerfilId !== null);

  const zona = paquete?.zonas.find((cada) => cada.id === zonaId) ?? null;
  const todosLosSectores = paquete?.sectores ?? [];
  const anotaciones = paquete?.anotaciones ?? [];
  const sectores = todosLosSectores.filter(
    (sector) => sector.zonaId === zonaId,
  );

  /**
   * Las rutas que cruzan la zona se piden **antes de los carteles de abajo**.
   *
   * Abriendo la pantalla en frío —por el link, recargando, o al volver a abrir
   * la app— el paquete todavía no está y la pantalla sale por el cartel de
   * «abriendo». Pedirlas después de ese cartel hace que en el primer dibujado
   * no se pidan y en el segundo sí, y React rompe la pantalla entera cuando eso
   * pasa. Mientras no hay zona se pregunta por un rectángulo vacío, que no
   * cruza ninguna ruta.
   */
  const { rutasCruzadas, idsEncendidos, toggleRuta, recorridoCombinado } =
    useRutasEnArea(
      zona?.rectangulo ?? { latNorte: 0, latSur: 0, lonEste: 0, lonOeste: 0 },
    );

  if (estado === "abriendo") {
    return (
      <Tarjeta className="py-8 text-center text-base text-texto-suave">
        Abriendo la zona…
      </Tarjeta>
    );
  }

  if (!zona) {
    return (
      <Tarjeta franja="rojo" className="space-y-3">
        <p role="alert" className="text-base leading-6 text-rojo-texto">
          Esta zona no está en el celular. Puede que la hayan borrado, o que
          todavía no se haya guardado acá.
        </p>
        <BotonVolver
          destinoSiNoHayVuelta="/zonas"
          etiqueta="Volver a las zonas"
        />
      </Tarjeta>
    );
  }

  const soyElAutor = puedeAdministrar && miPerfilId === zona.perfilId;

  const anotacionesDeLaZona = anotaciones.filter((anotacion) =>
    sectores.some((sector) => sector.id === anotacion.sectorId)
  );

  return (
    <div className="space-y-5">
      {estado === "sin_senal" ? (
        <Tarjeta>
          <p className="text-sm font-medium text-texto-suave">
            Sin señal. Estás viendo lo último que quedó guardado en el celular.
          </p>
        </Tarjeta>
      ) : null}

      <div className={`relative ${zona.fotoUrl ? "overflow-hidden rounded-2xl bg-superficie-alta p-4 sm:p-5" : ""}`}>
        {zona.fotoUrl ? (
          <>
            <img
              src={zona.fotoUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-slate-950/30" />
          </>
        ) : null}

        <div className={`relative z-10 flex items-center gap-3 ${zona.fotoUrl ? "mb-4" : ""}`}>
          <BotonVolver
            destinoSiNoHayVuelta="/zonas"
            etiqueta="Volver a las zonas"
            className={zona.fotoUrl ? "[&>span]:bg-black/40 [&>span]:text-white [&>span]:border-white/30" : ""}
          />
          <h1 className={`min-w-0 flex-1 truncate text-2xl font-bold uppercase ${zona.fotoUrl ? "text-white drop-shadow-md" : "text-texto"}`}>
            {zona.nombre}
          </h1>
        </div>

        <div className={`relative z-10 mt-5 px-1 text-sm ${zona.fotoUrl ? "text-slate-200 drop-shadow-sm" : "text-texto-suave"}`}>
          {zona.descripcion ? (
            <p className="whitespace-pre-wrap break-words mb-2 text-base">
              {zona.descripcion}
            </p>
          ) : null}
          <p>Le da a la zona: <span className={`font-semibold ${zona.fotoUrl ? "text-white drop-shadow-sm" : "text-texto"}`}>{mostrarTamano(zona.rectangulo)}</span></p>
        </div>
      </div>

      <Tarjeta className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
          Dónde queda
        </h2>
        <CargadorDeMapa
          enVivo
          principal
          recorrido={recorridoCombinado}
          controlesAdicionales={
            <SelectorDeRutasEnMapa
              rutasCruzadas={rutasCruzadas}
              idsEncendidos={idsEncendidos}
              toggleRuta={toggleRuta}
            />
          }
          anotaciones={anotacionesDeLaZona}
          encuadre={zona.rectangulo}
          rectangulos={[
            { rectangulo: zona.rectangulo, clase: "zona" },
            ...sectoresEnElMapa(sectores),
          ]}
        />
        <p className="text-sm leading-6 text-texto-suave">
          {sectores.length === 0
            ? "El recuadro es la zona. Todavía no tiene ningún sector encima."
            : `El recuadro grande es la zona; los de adentro, sus ${sectores.length === 1 ? "sector" : `${sectores.length} sectores`}.`}
        </p>
      </Tarjeta>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between gap-3 px-1">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
            {sectores.length === 0
              ? "Sectores"
              : `Sectores (${sectores.length})`}
          </h2>
        </div>

        {sectores.length === 0 ? null : (
          <div className="space-y-3">
            {sectores.map((sector) => (
              <TarjetaDeSector
                key={sector.id}
                sector={sector}
                todosLosSectores={todosLosSectores}
                anotaciones={anotaciones}
                soyAdministrador={puedeAdministrar && miPerfilId === sector.perfilId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
