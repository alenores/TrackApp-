"use client";

import { useMemo, type ReactNode } from "react";
import type { Position } from "geojson";
import { Emergente } from "@/components/ui/emergente";
import { BotonRedondo } from "@/components/ui/boton-redondo";
import { ICONO_DE_EDITAR, ICONO_DE_ELIMINAR } from "@/components/ui/iconos";
import { GraficoDeAlturas, type TramoDelGrafico } from "@/components/ui/grafico-de-alturas";
import { nombreDeComplejidad, nombreDelPaso } from "@/components/rutas/referencia-de-partes";
import { mostrarActividad } from "@/lib/rutas/actividades";
import { perfilDeLinea } from "@/lib/alturas/perfil";
import { textoDeAltura, textoDeDistancia } from "@/lib/alturas/grafico";
import { puntoEnDistancia } from "@/lib/caminos/geometria";
import type { CaminoGuardado } from "@/lib/caminos/datos";
import type { ActividadRuta } from "@/types/database";

type Propiedades = {
  camino: CaminoGuardado;
  indice: number;
  alCerrar: () => void;
  /** La actividad elegida en el mapa: decide los colores del gráfico. */
  actividad: ActividadRuta;
  /** Para que el mapa marque el lugar que se señala en el gráfico. */
  alSenalarPunto?: (punto: Position | null) => void;
  enNavegacion?: boolean;
  /** En Marcas, abre la misma pantalla de editar que los tres puntos. */
  alEditar?: () => void;
  /** En Marcas, la misma eliminación que los tres puntos, con confirmación. */
  alEliminar?: () => void;
};

/**
 * La ficha de un Camino. La misma en Consultas, en la navegación libre y al
 * navegar un Circuito: el encabezado dice de qué pantalla se trata y cada
 * dato va aparte, con su nombre arriba y el valor abajo.
 */
export function FichaDeCamino({ camino, indice, alCerrar, actividad, alSenalarPunto, enNavegacion = false, alEditar, alEliminar }: Propiedades) {
  const parte = camino.partes[indice];
  // Si el Camino no es de la actividad elegida, los colores son los de su primera actividad.
  const actividadDelGrafico = camino.actividades.includes(actividad) ? actividad : camino.actividades[0];

  const perfil = useMemo(() => (camino.alturas ? perfilDeLinea(camino.alturas, camino.largoM) : []), [camino.alturas, camino.largoM]);
  const tramos = useMemo<TramoDelGrafico[]>(() => camino.partes.map((cada) => {
    const clasificacion = cada.porActividad[actividadDelGrafico];
    return {
      desdeM: cada.desdeM,
      hastaM: cada.hastaM,
      estilo: clasificacion?.complejidad ?? "sin_clasificar",
      paso: clasificacion?.paso ?? null,
    };
  }), [camino.partes, actividadDelGrafico]);

  if (!parte) return null;
  const texto = enNavegacion ? "text-lg" : "text-base";

  return (
    // Como toda ficha: en el celular tapa todo, con la cruz y deslizable por
    // dentro; en la computadora, en Mapas, va al costado del mapa.
    <Emergente abierto alCerrar={alCerrar} titulo="Consulta Camino" ancho="amplio" alCostado>
      <dl className="divide-y divide-borde">
        <Dato nombre="Nombre" texto={texto}>{camino.nombre}</Dato>
        <Dato nombre="Largo" texto={texto}>{textoDeDistancia(camino.largoM)}</Dato>
        {camino.alturas ? (
          <>
            <Dato nombre="Desnivel positivo" texto={texto}>{textoDeAltura(camino.alturas.desnivelPositivoM)}</Dato>
            <Dato nombre="Desnivel negativo" texto={texto}>{textoDeAltura(camino.alturas.desnivelNegativoM)}</Dato>
          </>
        ) : (
          <Dato nombre="Alturas" texto={texto}>
            Este Camino todavía no tiene sus alturas en este celular. Abrí la app con conexión para ponerla al día.
          </Dato>
        )}
      </dl>

      {camino.alturas ? (
        <div className="mt-4 space-y-3">
          <GraficoDeAlturas
            perfil={perfil}
            tramos={tramos}
            enNavegacion={enNavegacion}
            descripcion={`Alturas de ${camino.nombre}: desnivel positivo ${textoDeAltura(camino.alturas.desnivelPositivoM)} y negativo ${textoDeAltura(camino.alturas.desnivelNegativoM)} en ${textoDeDistancia(camino.largoM)}.`}
            alSenalar={(distanciaM) => alSenalarPunto?.(distanciaM === null ? null : puntoEnDistancia(camino.coordenadas, distanciaM))}
          />
          <p className={`${texto} text-texto-suave`}>
            Medido desde donde empieza el dibujo; al revés, el positivo y el negativo se invierten.
            Colores según {mostrarActividad(actividadDelGrafico).etiqueta}. Las alturas salen del relieve del terreno: son una estimación.
          </p>
        </div>
      ) : null}

      <dl className="mt-4 divide-y divide-borde">
        <Dato nombre="Parte" texto={texto}>{indice + 1} de {camino.partes.length}</Dato>
        {camino.actividades.map((cada) => {
          const datos = parte.porActividad[cada];
          if (!datos) return null;
          return (
            <Dato key={cada} nombre={mostrarActividad(cada).etiqueta} texto={texto}>
              {nombreDelPaso(datos.paso, [cada])} · {nombreDeComplejidad(datos.complejidad)}
            </Dato>
          );
        })}
        {parte.observacion ? <Dato nombre="Observación" texto={texto}>{parte.observacion}</Dato> : null}
        {parte.comprobadoEl ? (
          <Dato nombre="Comprobado" texto={texto}>
            {new Date(`${parte.comprobadoEl}T12:00:00`).toLocaleDateString("es-AR")}
          </Dato>
        ) : null}
      </dl>
      {alEditar || alEliminar ? (
        <div className="mt-4 flex items-center gap-2">
          {alEditar ? <BotonRedondo etiqueta="Editar" onClick={alEditar}>{ICONO_DE_EDITAR}</BotonRedondo> : null}
          {alEliminar ? (
            <BotonRedondo etiqueta="Eliminar" variante="destructivo" onClick={alEliminar}>{ICONO_DE_ELIMINAR}</BotonRedondo>
          ) : null}
        </div>
      ) : null}
    </Emergente>
  );
}

function Dato({ nombre, texto, children }: { nombre: string; texto: string; children: ReactNode }) {
  return (
    <div className="space-y-1 py-3 first:pt-0 last:pb-0">
      <dt className={`${texto} font-semibold text-texto-suave`}>{nombre}</dt>
      <dd className={`whitespace-pre-wrap ${texto} font-semibold text-texto`}>{children}</dd>
    </div>
  );
}
