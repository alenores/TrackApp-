"use client";

import { useMemo } from "react";
import type { Position } from "geojson";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
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
};

export function FichaDeCamino({ camino, indice, alCerrar, actividad, alSenalarPunto, enNavegacion = false }: Propiedades) {
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
    <Tarjeta className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-bold text-texto">{camino.nombre}</h2>
        <Boton variante="fantasma" onClick={alCerrar} aria-label="Cerrar el detalle del Camino">Cerrar</Boton>
      </div>

      <dl className={`flex flex-wrap gap-x-4 gap-y-1 ${texto} text-texto`}>
        <div><dt className="inline text-texto-suave">Largo </dt><dd className="inline font-semibold">{textoDeDistancia(camino.largoM)}</dd></div>
        {camino.alturas ? (
          <>
            <div><dt className="inline text-texto-suave">Desnivel positivo </dt><dd className="inline font-semibold">{textoDeAltura(camino.alturas.desnivelPositivoM)}</dd></div>
            <div><dt className="inline text-texto-suave">Desnivel negativo </dt><dd className="inline font-semibold">{textoDeAltura(camino.alturas.desnivelNegativoM)}</dd></div>
          </>
        ) : null}
      </dl>

      {camino.alturas ? (
        <div className="space-y-1">
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
      ) : (
        <p className={`${texto} text-texto`}>
          Este Camino todavía no tiene sus alturas en este celular. Abrí la app con conexión para ponerla al día.
        </p>
      )}

      <p className={`${texto} text-texto-suave`}>Parte {indice + 1} de {camino.partes.length}</p>
      <div className="space-y-2">
        {camino.actividades.map((cada) => {
          const datos = parte.porActividad[cada];
          return datos ? (
            <p key={cada} className={`${texto} text-texto`}>
              <strong>{mostrarActividad(cada).etiqueta}:</strong> {nombreDelPaso(datos.paso, [cada])} · {nombreDeComplejidad(datos.complejidad)}
            </p>
          ) : null;
        })}
      </div>
      {parte.observacion ? <p className={`whitespace-pre-wrap ${texto} text-texto`}>{parte.observacion}</p> : null}
      {parte.comprobadoEl ? (
        <p className={`${texto} text-texto-suave`}>Comprobado el {new Date(`${parte.comprobadoEl}T12:00:00`).toLocaleDateString("es-AR")}</p>
      ) : null}
    </Tarjeta>
  );
}
