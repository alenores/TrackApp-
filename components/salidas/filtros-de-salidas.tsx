"use client";

import { useState } from "react";
import { Campo } from "@/components/ui/campo";
import { BotonDeEmergente, Emergente } from "@/components/ui/emergente";
import { Opciones, type Opcion } from "@/components/ui/opciones";
import { ACTIVIDADES, mostrarEsfuerzo } from "@/lib/rutas/actividades";
import { SIN_FILTROS, type FiltrosDeSalidas as Filtros } from "@/lib/salidas/filtros";
import {
  ACTIVIDADES_RUTA,
  NIVELES_ESFUERZO,
  type ActividadRuta,
  type NivelEsfuerzo,
  type PerfilBreve,
} from "@/types/database";

/**
 * La emergente para filtrar la lista de salidas: por título, qué hicieron,
 * esfuerzo, quién fue y entre qué fechas.
 *
 * Solo arma los filtros: aplicarlos lo hace la pantalla, cambiando la
 * dirección, y la búsqueda la resuelve la base.
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

type Props = {
  abierto: boolean;
  alCerrar: () => void;
  filtros: Filtros;
  perfiles: PerfilBreve[];
  alAplicar: (filtros: Filtros) => void;
};

export function FiltrosDeSalidas({ abierto, alCerrar, filtros, perfiles, alAplicar }: Props) {
  return abierto ? (
    <Contenido alCerrar={alCerrar} filtros={filtros} perfiles={perfiles} alAplicar={alAplicar} />
  ) : null;
}

/** Aparte para que cada vez que se abre arranque con los filtros que están puestos. */
function Contenido({ alCerrar, filtros, perfiles, alAplicar }: Omit<Props, "abierto">) {
  const [elegidos, setElegidos] = useState<Filtros>(filtros);
  const cambiar = (parcial: Partial<Filtros>) =>
    setElegidos((actuales) => ({ ...actuales, ...parcial }));

  return (
    <Emergente
      abierto
      alCerrar={alCerrar}
      titulo="Filtrar salidas"
      acciones={
        <>
          <BotonDeEmergente onClick={() => setElegidos(SIN_FILTROS)}>Limpiar</BotonDeEmergente>
          <BotonDeEmergente variante="principal" onClick={() => alAplicar(elegidos)}>
            Ver salidas
          </BotonDeEmergente>
        </>
      }
    >
      <div className="space-y-5">
        <Campo
          label="Título"
          id="filtro-titulo"
          type="search"
          value={elegidos.titulo}
          onChange={(evento) => cambiar({ titulo: evento.target.value })}
          placeholder="Champaquí"
          maxLength={120}
        />

        <Opciones
          etiqueta="Qué hicieron"
          opciones={OPCIONES_DE_ACTIVIDAD}
          elegidas={elegidos.actividades}
          alElegir={(valor) => cambiar({ actividades: alternar(elegidos.actividades, valor) })}
          columnas={2}
          multiple
        />

        <Opciones
          etiqueta="Esfuerzo"
          opciones={OPCIONES_DE_ESFUERZO}
          elegidas={elegidos.esfuerzos}
          alElegir={(valor) => cambiar({ esfuerzos: alternar(elegidos.esfuerzos, valor) })}
          columnas={4}
          multiple
        />

        {perfiles.length > 0 ? (
          <Opciones
            etiqueta="Quién fue"
            ayuda="La cargó o fue de compañero."
            opciones={perfiles.map((perfil) => ({ valor: perfil.id, etiqueta: perfil.nombre }))}
            elegidas={elegidos.participantes}
            alElegir={(valor) => cambiar({ participantes: alternar(elegidos.participantes, valor) })}
            columnas={2}
            multiple
          />
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Campo
            label="Desde"
            id="filtro-desde"
            type="date"
            value={elegidos.desde ?? ""}
            max={elegidos.hasta ?? undefined}
            onChange={(evento) => cambiar({ desde: evento.target.value || null })}
          />
          <Campo
            label="Hasta"
            id="filtro-hasta"
            type="date"
            value={elegidos.hasta ?? ""}
            min={elegidos.desde ?? undefined}
            onChange={(evento) => cambiar({ hasta: evento.target.value || null })}
          />
        </div>
      </div>
    </Emergente>
  );
}
