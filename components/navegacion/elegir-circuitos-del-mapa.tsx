"use client";

import { useMemo, useState } from "react";
import { Emergente, BotonDeEmergente } from "@/components/ui/emergente";
import { Boton } from "@/components/ui/boton";
import { CLASE_DE_TITULO_DE_SECCION } from "@/components/ui/opciones";
import { RenglonConCasilla } from "@/components/navegacion/renglon-con-casilla";
import { circuitosDelSector } from "@/lib/navegacion/mapa-libre";
import type { CircuitoSinDibujo } from "@/lib/offline/circuitos";
import type { Sector, Zona } from "@/types/database";

/**
 * Qué otros Circuitos se ven al navegar uno (decisión 068).
 *
 * Arriba se elige el sector por su nombre. Si hay más de una zona, primero
 * la zona. El Circuito que se está haciendo va aparte, sin tilde. Debajo,
 * solo los otros de ese sector: esos sí se prenden y se apagan. Lo que se
 * prendió en otro sector sigue prendido.
 */

type Props = {
  abierto: boolean;
  alCerrar: () => void;
  zonas: Zona[];
  sectores: Sector[];
  circuitos: CircuitoSinDibujo[];
  /** El sector cuya lista se muestra. `null` mientras no hay ninguno elegido. */
  sectorId: number | null;
  alElegirSector: (sectorId: number) => void;
  prendidas: Set<number>;
  alCambiar: (prendidas: Set<number>) => void;
  /** El Circuito que se está navegando: siempre prendido, no se apaga. */
  fija?: number | null;
};

export function ElegirCircuitosDelMapa({ abierto, alCerrar, ...resto }: Props) {
  return (
    <Emergente
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Circuitos en el mapa"
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
  circuitos,
  sectorId,
  alElegirSector,
  prendidas,
  alCambiar,
  fija = null,
}: Omit<Props, "abierto" | "alCerrar">) {
  const sector = sectores.find((cada) => cada.id === sectorId) ?? null;
  const zonaDelSector = sector ? (zonas.find((zona) => zona.id === sector.zonaId) ?? null) : null;
  const [zonaId, setZonaId] = useState<number | null>(zonaDelSector?.id ?? zonas[0]?.id ?? null);

  const zona = zonas.find((cada) => cada.id === zonaId) ?? null;
  const sectoresDeLaZona = useMemo(
    () => (zona ? sectores.filter((cada) => cada.zonaId === zona.id) : []),
    [zona, sectores],
  );

  const lista = useMemo(() => (sector ? circuitosDelSector(circuitos, sector) : []), [circuitos, sector]);
  const elQueNavegas = fija === null ? null : (circuitos.find((cada) => cada.id === fija) ?? null);
  const otros = lista.filter((circuito) => circuito.id !== fija);

  const elegirZona = (id: number) => {
    setZonaId(id);
    const deEsa = sectores.filter((cada) => cada.zonaId === id);
    if (!deEsa.some((cada) => cada.id === sectorId) && deEsa[0]) alElegirSector(deEsa[0].id);
  };

  const alternar = (id: number) => {
    if (id === fija) return;
    const nuevas = new Set(prendidas);
    if (nuevas.has(id)) nuevas.delete(id);
    else nuevas.add(id);
    alCambiar(nuevas);
  };

  const todasDelSector = (prender: boolean) => {
    const nuevas = new Set(prendidas);
    for (const circuito of otros) {
      if (prender) nuevas.add(circuito.id);
      else nuevas.delete(circuito.id);
    }
    alCambiar(nuevas);
  };

  return (
    <div className="space-y-4">
      {zonas.length === 0 ? (
        <p className="text-lg text-texto">No hay zonas guardadas en el celular.</p>
      ) : (
        <>
          {zonas.length > 1 ? (
            <div className="space-y-2">
              <p className={CLASE_DE_TITULO_DE_SECCION}>Zona</p>
              {zonas.map((cada) => (
                <Boton
                  key={cada.id}
                  anchoCompleto
                  variante={cada.id === zonaId ? "principal" : "secundario"}
                  aria-pressed={cada.id === zonaId}
                  className="whitespace-normal text-center"
                  onClick={() => elegirZona(cada.id)}
                >
                  {cada.nombre}
                </Boton>
              ))}
            </div>
          ) : null}

          {sectoresDeLaZona.length === 0 ? (
            <p className="text-lg text-texto">Esta zona no tiene sectores.</p>
          ) : sectoresDeLaZona.length === 1 && sector ? (
            <div className="rounded-xl border border-borde-fuerte bg-fondo px-3 py-2">
              <p className="text-lg font-bold text-texto">{sector.nombre}</p>
              <p className="text-lg text-texto-suave">{zona ? `Zona ${zona.nombre}` : "Sin zona"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className={CLASE_DE_TITULO_DE_SECCION}>Sector</p>
              {zonas.length === 1 && zona ? (
                <p className="text-lg text-texto-suave">Zona {zona.nombre}</p>
              ) : null}
              {sectoresDeLaZona.map((cada) => (
                <Boton
                  key={cada.id}
                  anchoCompleto
                  variante={cada.id === sectorId ? "principal" : "secundario"}
                  aria-pressed={cada.id === sectorId}
                  className="whitespace-normal text-center"
                  onClick={() => alElegirSector(cada.id)}
                >
                  {cada.nombre}
                </Boton>
              ))}
            </div>
          )}
        </>
      )}

      {elQueNavegas ? (
        <div className="rounded-xl border border-borde-fuerte bg-fondo px-3 py-2">
          <p className={CLASE_DE_TITULO_DE_SECCION}>El que navegás</p>
          <p className="mt-1 text-lg font-semibold text-texto">{elQueNavegas.nombre}</p>
        </div>
      ) : null}

      {sector ? (
        otros.length === 0 ? (
          <p className="text-lg text-texto">No hay otros Circuitos en este sector.</p>
        ) : (
          <div className="space-y-2">
            <p className={CLASE_DE_TITULO_DE_SECCION}>En este sector</p>
            <div className="grid grid-cols-2 gap-2">
              <Boton variante="secundario" onClick={() => todasDelSector(true)}>
                Todos
              </Boton>
              <Boton variante="secundario" onClick={() => todasDelSector(false)}>
                Ninguno
              </Boton>
            </div>
            <ul className="overflow-hidden rounded-xl border border-borde-fuerte bg-fondo">
              {otros.map((circuito) => (
                <RenglonConCasilla
                  key={circuito.id}
                  prendido={prendidas.has(circuito.id)}
                  alTocar={() => alternar(circuito.id)}
                >
                  {circuito.nombre}
                </RenglonConCasilla>
              ))}
            </ul>
          </div>
        )
      ) : null}
    </div>
  );
}
