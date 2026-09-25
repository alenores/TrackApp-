"use client";

import { Emergente, BotonDeEmergente } from "@/components/ui/emergente";
import { RenglonConCasilla } from "@/components/navegacion/renglon-con-casilla";
import type { FiltroDeAnotaciones } from "@/lib/anotaciones/filtro";

/**
 * Qué anotaciones se ven en el mapa: las tuyas, las del administrador y las
 * de los demás usuarios. Las tres se combinan como quieras.
 *
 * Ninguna es privada: esto no esconde nada a nadie, solo decide qué ves vos.
 */

type Props = {
  abierto: boolean;
  alCerrar: () => void;
  filtro: FiltroDeAnotaciones;
  alCambiar: (filtro: FiltroDeAnotaciones) => void;
  /** Cuántas hay de cada una, para que se sepa qué se está prendiendo. */
  cuantas: { mias: number; delAdministrador: number; deOtros: number };
};

export function ElegirAnotacionesDelMapa({ abierto, alCerrar, filtro, alCambiar, cuantas }: Props) {
  const renglon = (clave: keyof FiltroDeAnotaciones, texto: string) => (
    <RenglonConCasilla
      prendido={filtro[clave]}
      alTocar={() => alCambiar({ ...filtro, [clave]: !filtro[clave] })}
    >
      {texto} <span className="text-texto-suave">({cuantas[clave]})</span>
    </RenglonConCasilla>
  );

  return (
    <Emergente
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="Anotaciones en el mapa"
      acciones={
        <BotonDeEmergente variante="principal" onClick={alCerrar}>
          Listo
        </BotonDeEmergente>
      }
    >
      <ul className="overflow-hidden rounded-xl border border-borde-fuerte bg-fondo">
        {renglon("mias", "Las tuyas")}
        {renglon("delAdministrador", "Del administrador")}
        {renglon("deOtros", "De otros usuarios")}
      </ul>
    </Emergente>
  );
}
