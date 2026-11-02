"use client";

import { useState } from "react";
import { Tarjeta } from "@/components/ui/tarjeta";
import { InsigniaDeActividad } from "@/components/rutas/insignias-de-actividad";
import { mostrarActividad } from "@/lib/rutas/actividades";
import type { Resultado } from "@/lib/datos/resultado";
import type { ConsideracionDelCircuito, ResumenDelCircuito } from "@/lib/circuitos/resumen";

function kilometros(metros: number): string {
  return metros < 1000 ? `${Math.round(metros)} m` : `${(metros / 1000).toFixed(1).replace(".", ",")} km`;
}

/** «20,2 %», con coma como se escribe en Argentina. */
function porciento(valor: number): string {
  return `${String(valor).replace(".", ",")} %`;
}

function textoDeConsideracion(cada: ConsideracionDelCircuito): string {
  const actividad = mostrarActividad(cada.actividadDelCamino).etiqueta;
  switch (cada.tipo) {
    case "por_explorar": return `${cada.caminoNombre}: por explorar para ${actividad} (${kilometros(cada.metros)}).`;
    case "tentativo": return `${cada.caminoNombre}: tentativo para ${actividad}: posible camino, todavía sin comprobar bien (${kilometros(cada.metros)}).`;
    case "a_pie": return `${cada.caminoNombre}: hay que avanzar a pie con el equipo en ${actividad} (${kilometros(cada.metros)}).`;
    case "sin_paso": return `${cada.caminoNombre}: sin paso para ${actividad} (${kilometros(cada.metros)}).`;
    case "otra_actividad": return `${cada.caminoNombre}: figura para ${actividad}, otra actividad distinta de la del Circuito (${kilometros(cada.metros)}).`;
    case "camino_retirado": return `${cada.caminoNombre}: este Camino fue retirado de Mapas y permanece en el Circuito (${kilometros(cada.metros)}).`;
  }
}

/** Siempre debajo del mapa del Circuito, a partir de las clasificaciones actuales. */
export function ResumenDeCircuito({ resultado }: { resultado: Resultado<ResumenDelCircuito> }) {
  const [abierto, setAbierto] = useState(false);
  if (!resultado.ok) {
    return <Tarjeta franja="ambar"><h2 className="text-xl font-bold text-texto">Resumen del Circuito</h2>
      <p role="alert" className="mt-2 text-base text-texto">{resultado.error}</p></Tarjeta>;
  }
  const { datos } = resultado;
  return (
    <Tarjeta className="space-y-3">
      {/* Se pliega tocando el título: es para leer una vez, no para tener siempre abierto. */}
      <button type="button" aria-expanded={abierto} onClick={() => setAbierto((antes) => !antes)}
        className="flex w-full items-center justify-between gap-2 text-left">
        <h2 className="text-xl font-bold text-texto">Resumen del Circuito</h2>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`h-5 w-5 shrink-0 text-texto-suave transition-transform ${abierto ? "rotate-180" : ""}`} aria-hidden><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {abierto ? <>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-base text-texto">{kilometros(datos.metrosTotales)}</p>
        <InsigniaDeActividad tipo={datos.actividad} tamano="mediano" />
      </div>
      <p className="text-base text-texto">{porciento(datos.propia.porcentaje)} dibujado solo para este Circuito · {porciento(datos.sobreCaminos.porcentaje)} tomado de Caminos.</p>
      <p className="text-base text-texto">En los Caminos: por explorar {kilometros(datos.pasos.por_explorar.metros)} ({datos.tramosPorExplorar} {datos.tramosPorExplorar === 1 ? "tramo" : "tramos"}); tentativos {kilometros(datos.pasos.tentativo.metros)} ({datos.tramosTentativos} {datos.tramosTentativos === 1 ? "tramo" : "tramos"}); transitables {kilometros(datos.pasos.transitable.metros)}; a pie con el equipo {kilometros(datos.pasos.a_pie.metros)} ({datos.tramosAPie} {datos.tramosAPie === 1 ? "tramo" : "tramos"}); sin paso {kilometros(datos.pasos.sin_paso.metros)} ({datos.tramosSinPaso} {datos.tramosSinPaso === 1 ? "tramo" : "tramos"}).</p>
      <p className="text-base text-texto">Dificultad sobre el Circuito total: verde {porciento(datos.complejidades.facil.porcentaje)}, amarillo {porciento(datos.complejidades.media.porcentaje)}, rojo {porciento(datos.complejidades.dificil.porcentaje)}.</p>
      {datos.tramosDeOtraActividad > 0 ? <p className="text-base text-texto">{datos.tramosDeOtraActividad} {datos.tramosDeOtraActividad === 1 ? "tramo usa" : "tramos usan"} Caminos de otra actividad. Mirá el detalle antes de salir.</p> : null}
      {datos.tramosDeCaminosRetirados > 0 ? <p className="text-base text-texto">{datos.tramosDeCaminosRetirados} {datos.tramosDeCaminosRetirados === 1 ? "tramo pertenece" : "tramos pertenecen"} a Caminos retirados de Mapas.</p> : null}
      {datos.partesSinUnir > 0 ? <p className="text-base font-semibold text-texto">Partes sin unir: {datos.partesSinUnir}. Revisá dónde se interrumpe el Circuito antes de salir.</p> : null}
      {datos.separacionDelFinalM > 0 ? <p className="text-base text-texto">El Camino corregido termina {kilometros(datos.separacionDelFinalM)} antes del final que marcaste. En el mapa se ven los dos lugares sin dibujar una unión.</p> : null}
      {datos.consideraciones.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold text-texto">Consideraciones</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-base text-texto">
            {datos.consideraciones.map((cada, indice) => <li key={`${cada.caminoId}-${cada.tipo}-${indice}`}>{textoDeConsideracion(cada)}</li>)}
          </ul>
        </div>
      ) : <p className="text-base text-texto-suave">No hay consideraciones adicionales sobre los Caminos usados.</p>}
      <p className="text-base text-texto-suave">Los porcentajes toman como referencia el largo total del Circuito. Las partes propias no reciben dificultad ni marcas de paso de un Camino.</p>
      </> : null}
    </Tarjeta>
  );
}
