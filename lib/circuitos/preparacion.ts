import type { CaminoGuardado } from "@/lib/caminos/datos";
import type { CircuitoGuardado } from "@/lib/circuitos/datos";
import { actualizarCircuito, type CorreccionDeCamino } from "@/lib/circuitos/actualizar";
import { partesDelCircuitoEnElMapa } from "@/lib/circuitos/en-el-mapa";
import { resumirCircuito } from "@/lib/circuitos/resumen";
import { alturasDelCircuito } from "@/lib/circuitos/alturas";
import { calcularCobertura } from "@/lib/cobertura";
import type { Sector } from "@/types/database";
import { rectanguloQueAbarca } from "@/lib/datos/rectangulo";
import { exito, type Resultado } from "@/lib/datos/resultado";
import type { CircuitoPreparado, CircuitoSinDibujo } from "@/lib/offline/circuitos";

export function prepararCircuitosParaElCelular(
  circuitos: readonly CircuitoGuardado[],
  caminos: readonly CaminoGuardado[],
  correcciones: readonly CorreccionDeCamino[],
  sectores: readonly Sector[] = [],
): Resultado<{ fichas: CircuitoSinDibujo[]; dibujos: CircuitoPreparado[] }> {
  const fichas: CircuitoSinDibujo[] = [];
  const dibujos: CircuitoPreparado[] = [];
  for (const circuito of circuitos) {
    const actual = actualizarCircuito(circuito, caminos, correcciones);
    if (!actual.ok) return actual;
    const dibujo = partesDelCircuitoEnElMapa(actual.datos.partes, caminos, circuito.actividad);
    if (!dibujo.ok) return dibujo;
    const resumen = resumirCircuito(actual.datos.partes, caminos, circuito.actividad, actual.datos.finalSeparado);
    if (!resumen.ok) return resumen;
    const puntos: [number, number][] = dibujo.datos.features.flatMap((parte) =>
      parte.geometry.coordinates.map((punto): [number, number] => [punto[0], punto[1]]));
    if (actual.datos.finalSeparado) puntos.push([actual.datos.finalSeparado[0], actual.datos.finalSeparado[1]]);
    // Sin alturas el Circuito igual se puede navegar: el gráfico dice qué falta.
    const alturas = alturasDelCircuito(actual.datos.partes, caminos, circuito.alturasPropias);
    // Los sectores que cruza la línea de verdad, no su rectángulo: así el inicio
    // y la ficha del Circuito dicen lo mismo sobre qué mapas faltan.
    const cobertura = calcularCobertura(dibujo.datos, [...sectores]);
    const vinculados = new Set(circuito.caminosBase.map((base) => base.id));
    const ultimaVersion = caminos.filter((camino) => vinculados.has(camino.id))
      .map((camino) => camino.actualizadoEn)
      .reduce((ultima, fecha) => fecha > ultima ? fecha : ultima, circuito.actualizadoEn);
    const ficha: CircuitoSinDibujo = { id: circuito.id, nombre: circuito.nombre,
      actividad: circuito.actividad, actualizadoEn: ultimaVersion,
      rectangulo: puntos.length ? rectanguloQueAbarca(puntos) : null,
      datos: circuito.datos,
      // Primero el sector por donde pasa más metros: ahí abre la lista al navegar.
      sectores: [...cobertura.sectores].sort((a, b) => b.metros - a.metros).map((cada) => cada.sector.id),
      totales: {
        largoM: resumen.datos.metrosTotales,
        desnivelPositivoM: alturas.ok ? alturas.datos.desnivelPositivoM : null,
        desnivelNegativoM: alturas.ok ? alturas.datos.desnivelNegativoM : null,
      } };
    fichas.push(ficha);
    dibujos.push({ id: circuito.id, actualizadoEn: ultimaVersion,
      dibujo: dibujo.datos, resumen: resumen.datos, finalSeparado: actual.datos.finalSeparado,
      partes: actual.datos.partes, alturas });
  }
  return exito({ fichas, dibujos });
}
