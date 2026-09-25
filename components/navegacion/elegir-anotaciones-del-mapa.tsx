"use client";

import { Emergente, BotonDeEmergente } from "@/components/ui/emergente";
import { Boton } from "@/components/ui/boton";
import { CLASE_DE_TITULO_DE_SECCION } from "@/components/ui/opciones";
import { RenglonConCasilla } from "@/components/navegacion/renglon-con-casilla";
import type { FiltroDeAnotaciones } from "@/lib/anotaciones/filtro";

/**
 * Las anotaciones del mapa, en un solo lugar: agregar una nueva y elegir
 * cuáles se ven —las tuyas, las del administrador y las de los demás
 * usuarios—. Las tres se combinan como quieras.
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
  /** Empieza a marcar una anotación nueva. */
  alAgregar: () => void;
};

export function ElegirAnotacionesDelMapa({ abierto, alCerrar, filtro, alCambiar, cuantas, alAgregar }: Props) {
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
      titulo="Anotaciones"
      acciones={
        <BotonDeEmergente variante="principal" onClick={alCerrar}>
          Listo
        </BotonDeEmergente>
      }
    >
      <div className="space-y-4">
        <Boton anchoCompleto onClick={alAgregar}>
          Agregar una anotación
        </Boton>

        <section className="space-y-2">
          <h3 className={CLASE_DE_TITULO_DE_SECCION}>Cuáles se ven en el mapa</h3>
          <ul className="overflow-hidden rounded-xl border border-borde-fuerte bg-fondo">
            {renglon("mias", "Las tuyas")}
            {renglon("delAdministrador", "Del administrador")}
            {renglon("deOtros", "De otros usuarios")}
          </ul>
        </section>
      </div>
    </Emergente>
  );
}
