import { Tarjeta } from "@/components/ui/tarjeta";
import { mostrarActividad } from "@/lib/rutas/actividades";
import type { Resultado } from "@/lib/datos/resultado";
import type { ConsideracionDelCircuito, ResumenDelCircuito } from "@/lib/circuitos/resumen";

function kilometros(metros: number): string {
  return metros < 1000 ? `${Math.round(metros)} m` : `${(metros / 1000).toFixed(1).replace(".", ",")} km`;
}

function textoDeConsideracion(cada: ConsideracionDelCircuito): string {
  const actividad = mostrarActividad(cada.actividadDelCamino).etiqueta;
  switch (cada.tipo) {
    case "por_explorar": return `${cada.caminoNombre}: por explorar para ${actividad} (${kilometros(cada.metros)}).`;
    case "a_pie": return `${cada.caminoNombre}: hay que avanzar a pie con el equipo en ${actividad} (${kilometros(cada.metros)}).`;
    case "sin_paso": return `${cada.caminoNombre}: sin paso para ${actividad} (${kilometros(cada.metros)}).`;
    case "otra_actividad": return `${cada.caminoNombre}: figura para ${actividad}, otra actividad distinta de la del Circuito (${kilometros(cada.metros)}).`;
    case "camino_retirado": return `${cada.caminoNombre}: este Camino fue retirado de Mapas y permanece en el Circuito (${kilometros(cada.metros)}).`;
  }
}

/** Siempre debajo del mapa del Circuito, a partir de las clasificaciones actuales. */
export function ResumenDeCircuito({ resultado }: { resultado: Resultado<ResumenDelCircuito> }) {
  if (!resultado.ok) {
    return <Tarjeta franja="ambar"><h2 className="text-xl font-bold text-texto">Resumen del Circuito</h2>
      <p role="alert" className="mt-2 text-base text-texto">{resultado.error}</p></Tarjeta>;
  }
  const { datos } = resultado;
  return (
    <Tarjeta className="space-y-3">
      <h2 className="text-xl font-bold text-texto">Resumen del Circuito</h2>
      <p className="text-base text-texto">{kilometros(datos.metrosTotales)} · {mostrarActividad(datos.actividad).etiqueta}</p>
      <p className="text-base text-texto">{datos.propia.porcentaje}% dibujado solo para este Circuito · {datos.sobreCaminos.porcentaje}% tomado de Caminos.</p>
      <p className="text-base text-texto">En los Caminos: por explorar {kilometros(datos.pasos.por_explorar.metros)} ({datos.tramosPorExplorar} {datos.tramosPorExplorar === 1 ? "tramo" : "tramos"}); transitables {kilometros(datos.pasos.transitable.metros)}; a pie con el equipo {kilometros(datos.pasos.a_pie.metros)} ({datos.tramosAPie} {datos.tramosAPie === 1 ? "tramo" : "tramos"}); sin paso {kilometros(datos.pasos.sin_paso.metros)} ({datos.tramosSinPaso} {datos.tramosSinPaso === 1 ? "tramo" : "tramos"}).</p>
      <p className="text-base text-texto">Dificultad sobre el Circuito total: verde {datos.complejidades.facil.porcentaje}%, amarillo {datos.complejidades.media.porcentaje}%, rojo {datos.complejidades.dificil.porcentaje}%.</p>
      {datos.tramosDeOtraActividad > 0 ? <p className="text-base text-texto">{datos.tramosDeOtraActividad} {datos.tramosDeOtraActividad === 1 ? "tramo usa" : "tramos usan"} Caminos de otra actividad. Mirá el detalle antes de salir.</p> : null}
      {datos.tramosDeCaminosRetirados > 0 ? <p className="text-base text-texto">{datos.tramosDeCaminosRetirados} {datos.tramosDeCaminosRetirados === 1 ? "tramo pertenece" : "tramos pertenecen"} a Caminos retirados de Mapas.</p> : null}
      {datos.partesSinUnir > 0 ? <p className="text-base font-semibold text-texto">Partes sin unir: {datos.partesSinUnir}. Revisá dónde se interrumpe el Circuito antes de salir.</p> : null}
      {datos.consideraciones.length > 0 ? (
        <div>
          <h3 className="text-lg font-semibold text-texto">Consideraciones</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-base text-texto">
            {datos.consideraciones.map((cada, indice) => <li key={`${cada.caminoId}-${cada.tipo}-${indice}`}>{textoDeConsideracion(cada)}</li>)}
          </ul>
        </div>
      ) : <p className="text-base text-texto-suave">No hay consideraciones adicionales sobre los Caminos usados.</p>}
      <p className="text-base text-texto-suave">Los porcentajes toman como referencia el largo total del Circuito. Las partes propias no reciben dificultad ni marcas de paso de un Camino.</p>
    </Tarjeta>
  );
}
