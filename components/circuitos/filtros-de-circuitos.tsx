"use client";

import { useState } from "react";
import { BuscadorDePersonas } from "@/components/ui/buscador-de-personas";
import { Campo } from "@/components/ui/campo";
import { BotonDeEmergente, Emergente } from "@/components/ui/emergente";
import { Opciones, type Opcion } from "@/components/ui/opciones";
import { ACTIVIDADES, mostrarEsfuerzo } from "@/lib/rutas/actividades";
import {
  leerKilometros,
  SIN_FILTROS_DE_CIRCUITOS,
  type FiltrosDeCircuitos as Filtros,
} from "@/lib/circuitos/filtros";
import {
  ACTIVIDADES_RUTA,
  NIVELES_ESFUERZO,
  type ActividadRuta,
  type NivelEsfuerzo,
  type PerfilBreve,
} from "@/types/database";

/**
 * La emergente para filtrar la lista de Circuitos: por actividad, quién lo
 * creó, largo y esfuerzo. El nombre se busca aparte, arriba de la lista, y
 * estos filtros no lo tocan. Solo arma los filtros: aplicarlos lo hace la
 * pantalla, en el celular.
 */

const OPCIONES_DE_ACTIVIDAD: Opcion<ActividadRuta>[] = ACTIVIDADES_RUTA.map((tipo) => {
  const actividad = ACTIVIDADES.find((cada) => cada.tipo === tipo);
  return { valor: tipo, etiqueta: actividad?.etiqueta ?? tipo, trazo: actividad?.trazo };
});

const OPCIONES_DE_ESFUERZO: Opcion<NivelEsfuerzo>[] = NIVELES_ESFUERZO.map((nivel) => ({
  valor: nivel,
  etiqueta: mostrarEsfuerzo(nivel),
}));

function alternar<T>(lista: T[], valor: T): T[] {
  return lista.includes(valor) ? lista.filter((cada) => cada !== valor) : [...lista, valor];
}

function comoTexto(valor: number | null): string {
  return valor === null ? "" : String(valor).replace(".", ",");
}

type Props = {
  abierto: boolean;
  alCerrar: () => void;
  filtros: Filtros;
  /** Quienes crearon algún Circuito. */
  autores: PerfilBreve[];
  alAplicar: (filtros: Filtros) => void;
};

export function FiltrosDeCircuitos({ abierto, alCerrar, filtros, autores, alAplicar }: Props) {
  return abierto ? (
    <Contenido alCerrar={alCerrar} filtros={filtros} autores={autores} alAplicar={alAplicar} />
  ) : null;
}

/** Aparte para que cada vez que se abre arranque con los filtros que están puestos. */
function Contenido({ alCerrar, filtros, autores, alAplicar }: Omit<Props, "abierto">) {
  const [elegidos, setElegidos] = useState<Filtros>(filtros);
  const [desde, setDesde] = useState(comoTexto(filtros.largoDesdeKm));
  const [hasta, setHasta] = useState(comoTexto(filtros.largoHastaKm));
  const cambiar = (parcial: Partial<Filtros>) => setElegidos((actuales) => ({ ...actuales, ...parcial }));

  const desdeKm = leerKilometros(desde);
  const hastaKm = leerKilometros(hasta);
  const desdeMal = desde.trim() !== "" && desdeKm === null;
  const hastaMal = hasta.trim() !== "" && hastaKm === null;
  const alReves = desdeKm !== null && hastaKm !== null && desdeKm > hastaKm;

  return (
    <Emergente
      abierto
      alCerrar={alCerrar}
      titulo="Filtrar Circuitos"
      acciones={
        <>
          <BotonDeEmergente
            onClick={() => {
              setElegidos({ ...SIN_FILTROS_DE_CIRCUITOS, nombre: elegidos.nombre });
              setDesde("");
              setHasta("");
            }}
          >
            Limpiar
          </BotonDeEmergente>
          <BotonDeEmergente
            variante="principal"
            disabled={desdeMal || hastaMal || alReves}
            onClick={() => alAplicar({ ...elegidos, largoDesdeKm: desdeKm, largoHastaKm: hastaKm })}
          >
            Ver Circuitos
          </BotonDeEmergente>
        </>
      }
    >
      <div className="space-y-5">
        <Opciones
          etiqueta="Actividad"
          opciones={OPCIONES_DE_ACTIVIDAD}
          elegidas={elegidos.actividades}
          alElegir={(valor) => cambiar({ actividades: alternar(elegidos.actividades, valor) })}
          columnas={2}
          multiple
        />

        {autores.length > 0 ? (
          <BuscadorDePersonas
            etiqueta="Creado por"
            id="filtro-autores"
            personas={autores}
            elegidas={elegidos.autores}
            alCambiar={(autores) => cambiar({ autores })}
          />
        ) : null}

        <div className="space-y-2">
          <div className="flex flex-wrap gap-3">
            <div className="w-36">
              <Campo
                label="Largo desde (km)"
                id="filtro-largo-desde"
                inputMode="decimal"
                value={desde}
                onChange={(evento) => setDesde(evento.target.value)}
                placeholder="0"
                maxLength={6}
                error={desdeMal ? "Escribí un número, como 5 o 12,5." : undefined}
              />
            </div>
            <div className="w-36">
              <Campo
                label="Largo hasta (km)"
                id="filtro-largo-hasta"
                inputMode="decimal"
                value={hasta}
                onChange={(evento) => setHasta(evento.target.value)}
                placeholder="Sin tope"
                maxLength={6}
                error={hastaMal ? "Escribí un número, como 5 o 12,5." : undefined}
              />
            </div>
          </div>
          {alReves ? (
            <p role="alert" className="text-sm leading-6 text-rojo-texto">
              «Desde» es más que «hasta». Dalos vuelta para ver Circuitos.
            </p>
          ) : null}
        </div>

        <Opciones
          etiqueta="Esfuerzo"
          opciones={OPCIONES_DE_ESFUERZO}
          elegidas={elegidos.esfuerzos}
          alElegir={(valor) => cambiar({ esfuerzos: alternar(elegidos.esfuerzos, valor) })}
          columnas={4}
          multiple
        />
      </div>
    </Emergente>
  );
}
