"use client";

import { useMemo, useState } from "react";
import type { TipoDeFondo } from "@/components/mapa/capas-base";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { Emergente, BotonDeEmergente } from "@/components/ui/emergente";
import { Boton } from "@/components/ui/boton";
import { BotonRedondo, ICONOS_DEL_CERRO } from "@/components/ui/boton-redondo";
import { Opciones } from "@/components/ui/opciones";
import { RenglonConCasilla } from "@/components/navegacion/renglon-con-casilla";
import { hexDeLaRuta } from "@/lib/rutas/colores";
import { etiquetaDeSector, type RectanguloEnElMapa } from "@/lib/mapas/rectangulos";
import { rutasDelSector, sectorEnElLugar } from "@/lib/navegacion/mapa-libre";
import type { RutaResumen, Sector, Zona } from "@/types/database";

/**
 * Qué rutas se ven en los mapas del cerro: navegar una ruta y el mapa libre.
 *
 * **La lista es la de un sector.** Arriba dice cuál y de qué zona; el ícono de
 * mapa abre un mapa chico de la zona con sus sectores, y tocando uno la lista
 * pasa a ser la de ese. Zona y sector son el filtro: lo que se prendió en otro
 * sector sigue prendido.
 *
 * El mapa chico lee lo guardado en el celular, como todo lo del cerro: nunca
 * pide nada a internet. Sin mapa bajado, los sectores se ven sobre fondo liso.
 */

type Props = {
  abierto: boolean;
  alCerrar: () => void;
  zonas: Zona[];
  sectores: Sector[];
  rutas: RutaResumen[];
  /** El sector cuya lista se muestra. `null` mientras no hay ninguno elegido. */
  sectorId: number | null;
  alElegirSector: (sectorId: number) => void;
  prendidas: Set<number>;
  alCambiar: (prendidas: Set<number>) => void;
  /** La ruta que se está navegando: siempre prendida, no se apaga. */
  fija?: number | null;
  posicion: { lat: number; lon: number } | null;
  fondosDisponibles: TipoDeFondo[];
};

export function ElegirRutasDelMapa({ abierto, alCerrar, ...resto }: Props) {
  return (
    <Emergente
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Rutas en el mapa"
      acciones={
        <BotonDeEmergente variante="principal" onClick={alCerrar}>
          Listo
        </BotonDeEmergente>
      }
    >
      {/* Se arma de nuevo cada vez que se abre: así arranca en su lugar. */}
      <Contenido {...resto} />
    </Emergente>
  );
}

function Contenido({
  zonas,
  sectores,
  rutas,
  sectorId,
  alElegirSector,
  prendidas,
  alCambiar,
  fija = null,
  posicion,
  fondosDisponibles,
}: Omit<Props, "abierto" | "alCerrar">) {
  const sector = sectores.find((cada) => cada.id === sectorId) ?? null;
  const zonaDelSector = sector ? (zonas.find((zona) => zona.id === sector.zonaId) ?? null) : null;

  // Sin sector elegido, el mapa chico ya abierto para elegir uno; con sector,
  // la lista, en la zona de ese sector.
  const [verMapa, setVerMapa] = useState(sectorId === null);
  const [zonaId, setZonaId] = useState<number | null>(zonaDelSector?.id ?? zonas[0]?.id ?? null);

  const zona = zonas.find((cada) => cada.id === zonaId) ?? null;
  const sectoresDeLaZona = useMemo(
    () => (zona ? sectores.filter((cada) => cada.zonaId === zona.id) : []),
    [zona, sectores],
  );

  const rectangulos: RectanguloEnElMapa[] = zona
    ? [
        { rectangulo: zona.rectangulo, clase: "zona" },
        ...sectoresDeLaZona.map((cada) => ({
          rectangulo: cada.rectangulo,
          clase: cada.id === sectorId ? ("sector_elegido" as const) : ("sector" as const),
          etiqueta: etiquetaDeSector(cada.nombre),
        })),
      ]
    : [];

  const lista = useMemo(() => (sector ? rutasDelSector(rutas, sector) : []), [rutas, sector]);

  const alternar = (id: number) => {
    if (id === fija) return;
    const nuevas = new Set(prendidas);
    if (nuevas.has(id)) nuevas.delete(id);
    else nuevas.add(id);
    alCambiar(nuevas);
  };

  const todasDelSector = (prender: boolean) => {
    const nuevas = new Set(prendidas);
    for (const ruta of lista) {
      if (ruta.id === fija) continue;
      if (prender) nuevas.add(ruta.id);
      else nuevas.delete(ruta.id);
    }
    alCambiar(nuevas);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-borde-fuerte bg-fondo py-2 pl-3 pr-2">
        <div className="min-w-0 flex-1">
          {sector ? (
            <>
              <p className="truncate text-lg font-bold text-texto">{sector.nombre}</p>
              <p className="truncate text-sm text-texto-suave">
                {zonaDelSector ? `Zona ${zonaDelSector.nombre}` : "Sin zona"}
              </p>
            </>
          ) : (
            <p className="text-base text-texto">Todavía no hay un sector elegido.</p>
          )}
        </div>
        <BotonRedondo
          etiqueta={verMapa ? "Cerrar el mapa de la zona" : "Ver el mapa de la zona"}
          variante={verMapa ? "principal" : "secundario"}
          aria-pressed={verMapa}
          className="shadow-none"
          onClick={() => setVerMapa((antes) => !antes)}
        >
          {ICONOS_DEL_CERRO.mapa}
        </BotonRedondo>
      </div>

      {verMapa ? (
        zonas.length === 0 ? (
          <p className="text-base leading-6 text-texto-suave">
            No hay zonas guardadas en el celular.
          </p>
        ) : (
          <div className="space-y-2">
            {zonas.length > 1 ? (
              <Opciones
                etiqueta="Zona"
                opciones={zonas.map((cada) => ({ valor: cada.id, etiqueta: cada.nombre }))}
                elegidas={zonaId === null ? [] : [zonaId]}
                alElegir={(id) => setZonaId(id)}
                columnas={2}
              />
            ) : null}

            <CargadorDeMapa
              encuadre={zona?.rectangulo ?? null}
              rectangulos={rectangulos}
              miPosicion={posicion}
              fondoInicial={fondosDisponibles[0] ?? "dibujo"}
              fondosDisponibles={fondosDisponibles}
              marcandoPunto
              miniatura
              sinMapaDescargado={fondosDisponibles.length === 0}
              alMarcarPunto={(lon, lat) => {
                const tocado = sectorEnElLugar(sectoresDeLaZona, { lat, lon });
                if (tocado) alElegirSector(tocado.id);
              }}
            />

            <p className="text-sm leading-6 text-texto-suave">
              {sectoresDeLaZona.length === 0
                ? "Esta zona no tiene sectores guardados."
                : "Tocá un sector para ver sus rutas. El punto azul sos vos."}
            </p>
          </div>
        )
      ) : null}

      {sector ? (
        lista.length === 0 ? (
          <p className="text-base leading-6 text-texto-suave">
            Este sector no tiene rutas guardadas en el celular.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Boton variante="secundario" onClick={() => todasDelSector(true)}>
                Todas
              </Boton>
              <Boton variante="secundario" onClick={() => todasDelSector(false)}>
                Ninguna
              </Boton>
            </div>

            <ul className="overflow-hidden rounded-xl border border-borde-fuerte bg-fondo">
              {lista.map((ruta) => (
                <RenglonConCasilla
                  key={ruta.id}
                  prendido={ruta.id === fija || prendidas.has(ruta.id)}
                  alTocar={() => alternar(ruta.id)}
                  muestra={
                    <span
                      aria-hidden
                      className="h-1.5 w-6 shrink-0 rounded-full"
                      // El color de cada ruta es un dato de la ruta, no del tema.
                      style={{ backgroundColor: hexDeLaRuta(ruta.color) }}
                    />
                  }
                >
                  {ruta.nombre}
                  {ruta.id === fija ? (
                    <span className="text-texto-suave"> · la que navegás</span>
                  ) : null}
                </RenglonConCasilla>
              ))}
            </ul>
          </div>
        )
      ) : null}
    </div>
  );
}
