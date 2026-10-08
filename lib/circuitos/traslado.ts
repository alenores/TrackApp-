import type { Position } from "geojson";
import type { CaminoParaCircuito, ParteDibujada } from "@/lib/circuitos/dibujo";
import { distanciasAcumuladas, largoDeLinea, tramoDeLinea, ubicarEnLinea } from "@/lib/caminos/geometria";
import { distanciaEnMetros, puntoDeCoordenada } from "@/lib/geo";
import { exito, falla, type Resultado } from "@/lib/datos/resultado";

const MISMO_LUGAR_GRADOS = 1e-9;
const MISMO_LUGAR_METROS = 0.5;
const REDONDEO_METROS = 1e-6;

function mismoLugar(a: Position, b: Position): boolean {
  return Math.abs(a[0] - b[0]) < MISMO_LUGAR_GRADOS && Math.abs(a[1] - b[1]) < MISMO_LUGAR_GRADOS;
}

function metrosEntre(a: Position, b: Position): number {
  return distanciaEnMetros(puntoDeCoordenada(a), puntoDeCoordenada(b));
}

/**
 * La misma correspondencia que usa la corrección de partes de un Camino.
 * La punta del Circuito se resuelve aparte: sus metros no deben saltar a la
 * punta nueva solo porque el Camino se alargó o acortó.
 */
export function correspondenciaDeCorreccion(
  anteriores: Position[],
  actuales: Position[],
): Resultado<{ mover: (distanciaAnteriorM: number) => number; largoAnteriorM: number; largoActualM: number }> {
  if (anteriores.length < 2 || actuales.length < 2) {
    return falla("El Camino no tiene una línea completa para actualizar el Circuito. Revisalo con señal antes de salir.");
  }
  const largoAnteriorM = largoDeLinea(anteriores);
  const largoActualM = largoDeLinea(actuales);
  if (largoAnteriorM <= 0 || largoActualM <= 0) {
    return falla("El Camino tiene una línea sin largo. Revisalo con señal antes de salir.");
  }

  const invertida = !mismoLugar(anteriores[0], actuales[0])
    && mismoLugar(anteriores[0], actuales.at(-1)!)
    && mismoLugar(anteriores.at(-1)!, actuales[0]);
  const viejas = invertida ? [...anteriores].reverse() : anteriores;
  const acumuladasViejas = distanciasAcumuladas(viejas);
  const acumuladasNuevas = distanciasAcumuladas(actuales);
  const n = viejas.length;
  const m = actuales.length;

  let igualesAlInicio = 0;
  while (igualesAlInicio < Math.min(n, m) && mismoLugar(viejas[igualesAlInicio], actuales[igualesAlInicio])) {
    igualesAlInicio += 1;
  }
  let igualesAlFinal = 0;
  const maximoAlFinal = Math.min(n, m) - igualesAlInicio;
  while (igualesAlFinal < maximoAlFinal && mismoLugar(viejas[n - 1 - igualesAlFinal], actuales[m - 1 - igualesAlFinal])) {
    igualesAlFinal += 1;
  }

  const finIntactoViejo = igualesAlInicio > 0 ? acumuladasViejas[igualesAlInicio - 1] : 0;
  const finIntactoNuevo = igualesAlInicio > 0 ? acumuladasNuevas[igualesAlInicio - 1] : 0;
  const inicioIntactoViejo = igualesAlFinal > 0 ? acumuladasViejas[n - igualesAlFinal] : largoAnteriorM;
  const inicioIntactoNuevo = igualesAlFinal > 0 ? acumuladasNuevas[m - igualesAlFinal] : largoActualM;
  const corrimiento = inicioIntactoNuevo - inicioIntactoViejo;
  const tramoViejo = inicioIntactoViejo - finIntactoViejo;
  const tramoNuevo = inicioIntactoNuevo - finIntactoNuevo;

  function mover(distanciaAnteriorM: number): number {
    const distancia = invertida ? largoAnteriorM - distanciaAnteriorM : distanciaAnteriorM;
    if (distancia <= 0) return 0;
    if (distancia >= largoAnteriorM) return largoActualM;
    if (distancia <= finIntactoViejo) return distancia;
    if (distancia >= inicioIntactoViejo) return distancia + corrimiento;
    return tramoViejo <= REDONDEO_METROS
      ? finIntactoNuevo
      : finIntactoNuevo + ((distancia - finIntactoViejo) / tramoViejo) * tramoNuevo;
  }

  return exito({ mover, largoAnteriorM, largoActualM });
}

export type FinalTrasladado = {
  /** Línea tomada del Camino corregido; nunca incluye una unión supuesta. */
  parte: ParteDibujada | null;
  /** El lugar elegido por la persona, que no cambia con la punta del Camino. */
  lugarConservado: Position;
  /** Final de la línea que realmente existe después de corregir el Camino. */
  finDeLaLinea: Position | null;
  /** Si es mayor que cero, se muestra «Partes sin unir» en el Circuito. */
  separacionM: number;
};

/** Actualiza una parte interna siguiendo la forma nueva del Camino. */
export function trasladarParteSobreCamino(
  parte: ParteDibujada,
  anterior: CaminoParaCircuito,
  actual: CaminoParaCircuito,
): Resultado<ParteDibujada> {
  if (parte.tipo !== "sobre_camino" || parte.caminoId !== anterior.id || anterior.id !== actual.id
    || parte.versionForma !== anterior.versionForma || actual.versionForma <= anterior.versionForma
    || parte.desdeM === null || parte.hastaM === null || !parte.sentido) {
    return falla("No coinciden las versiones de una parte del Circuito y su Camino. Abrí el Circuito con señal para revisarlo.");
  }
  const correspondencia = correspondenciaDeCorreccion(anterior.coordenadas, actual.coordenadas);
  if (!correspondencia.ok) return correspondencia;
  const { mover, largoAnteriorM } = correspondencia.datos;
  if (parte.desdeM < 0 || parte.hastaM > largoAnteriorM + REDONDEO_METROS || parte.hastaM <= parte.desdeM) {
    return falla("Una parte del Circuito quedó fuera del Camino anterior. Abrila con señal para revisarla.");
  }
  const comienzoAnteriorM = parte.sentido === "ida" ? parte.desdeM : parte.hastaM;
  const finalAnteriorM = parte.sentido === "ida" ? parte.hastaM : parte.desdeM;
  const comienzoActualM = mover(comienzoAnteriorM);
  const finalActualM = mover(finalAnteriorM);
  const desdeM = Math.min(comienzoActualM, finalActualM);
  const hastaM = Math.max(comienzoActualM, finalActualM);
  if (hastaM - desdeM <= REDONDEO_METROS) {
    return falla("Una parte del Circuito desapareció al corregir el Camino. Abrí el Circuito con señal para revisarla.");
  }
  const sentido = comienzoActualM > finalActualM ? "vuelta" : "ida";
  const coordenadas = tramoDeLinea(actual.coordenadas, desdeM, hastaM);
  if (sentido === "vuelta") coordenadas.reverse();
  return exito({ ...parte, sentido, coordenadas, desdeM, hastaM, versionForma: actual.versionForma });
}

/**
 * Actualiza la última parte de un Circuito cuando terminaba en una punta del
 * Camino. Lo demás sigue la línea corregida; el final elegido queda fijo.
 */
export function trasladarFinalSobreCamino(
  ultimaParte: ParteDibujada,
  anterior: CaminoParaCircuito,
  actual: CaminoParaCircuito,
  finalMarcado: Position | null = null,
): Resultado<FinalTrasladado> {
  if (ultimaParte.tipo !== "sobre_camino" || ultimaParte.caminoId !== anterior.id || anterior.id !== actual.id
    || ultimaParte.versionForma !== anterior.versionForma || actual.versionForma <= anterior.versionForma) {
    return falla("No coinciden las versiones del Camino y del Circuito. Abrí el Circuito con señal para revisarlo.");
  }
  if (ultimaParte.desdeM === null || ultimaParte.hastaM === null || !ultimaParte.sentido
    || ultimaParte.coordenadas.length < 2) {
    return falla("El final del Circuito no tiene una línea válida. Abrilo con señal para revisarlo.");
  }
  const correspondencia = correspondenciaDeCorreccion(anterior.coordenadas, actual.coordenadas);
  if (!correspondencia.ok) return correspondencia;
  const { mover, largoAnteriorM, largoActualM } = correspondencia.datos;
  const finalAnteriorM = ultimaParte.sentido === "ida" ? ultimaParte.hastaM : ultimaParte.desdeM;
  if (Math.abs(finalAnteriorM) > REDONDEO_METROS && Math.abs(finalAnteriorM - largoAnteriorM) > REDONDEO_METROS) {
    return falla("Este final no estaba en una punta del Camino. Revisá el Circuito antes de actualizarlo.");
  }
  const comienzoAnteriorM = ultimaParte.sentido === "ida" ? ultimaParte.desdeM : ultimaParte.hastaM;
  const comienzoActualM = mover(comienzoAnteriorM);
  const finalCalculadoM = mover(finalAnteriorM);
  const lugarConservado = [...(finalMarcado ?? ultimaParte.coordenadas.at(-1)!)];
  const proyeccion = ubicarEnLinea(actual.coordenadas, lugarConservado[0], lugarConservado[1]);
  const finalActualM = proyeccion && proyeccion.alejamientoM <= MISMO_LUGAR_METROS
    ? proyeccion.distanciaM : finalCalculadoM;
  const desdeM = Math.min(comienzoActualM, finalActualM);
  const hastaM = Math.max(comienzoActualM, finalActualM);
  if (desdeM < -REDONDEO_METROS || hastaM > largoActualM + REDONDEO_METROS) {
    return falla("La corrección del Camino dejó el Circuito fuera de su línea. Abrilo con señal para revisarlo.");
  }

  if (hastaM - desdeM <= REDONDEO_METROS) {
    const finDeLaLinea = finalActualM <= REDONDEO_METROS
      ? actual.coordenadas[0] : actual.coordenadas.at(-1)!;
    return exito({ parte: null, lugarConservado, finDeLaLinea,
      separacionM: metrosEntre(lugarConservado, finDeLaLinea) });
  }
  const sentido = comienzoActualM > finalActualM ? "vuelta" : "ida";
  const coordenadas = tramoDeLinea(actual.coordenadas, desdeM, hastaM);
  if (sentido === "vuelta") coordenadas.reverse();
  const finDeLaLinea = coordenadas.at(-1)!;
  return exito({
    parte: {
      ...ultimaParte, sentido, coordenadas, desdeM, hastaM,
      versionForma: actual.versionForma,
    },
    lugarConservado,
    finDeLaLinea,
    separacionM: metrosEntre(lugarConservado, finDeLaLinea) <= MISMO_LUGAR_METROS
      ? 0 : metrosEntre(lugarConservado, finDeLaLinea),
  });
}

export type CircuitoTrasCorreccion = {
  partes: ParteDibujada[];
  /** Se pasa al mapa y al resumen solo cuando quedó separado de la línea. */
  finalSeparado: Position | null;
  separacionFinalM: number;
};

/**
 * Una corrección actualiza todas las partes del Circuito que usan ese Camino.
 * La punta final marcada sigue en su lugar; jamás se agrega una línea recta
 * para disimular la separación que pueda quedar.
 */
export function trasladarCircuitoConCaminoCorregido(
  partes: readonly ParteDibujada[],
  anterior: CaminoParaCircuito,
  actual: CaminoParaCircuito,
  finalYaSeparado: Position | null = null,
): Resultado<CircuitoTrasCorreccion> {
  const nuevas: Array<ParteDibujada | null> = [...partes];
  let finalSeparado: Position | null = finalYaSeparado;
  let separacionFinalM = 0;

  function moverUnionLibre(indice: number, vieja: Position, nueva: Position, extremo: "inicio" | "final") {
    const vecina = nuevas[indice];
    if (!vecina || vecina.tipo !== "libre" || vecina.coordenadas.length < 2) return;
    const posicion = extremo === "inicio" ? 0 : vecina.coordenadas.length - 1;
    if (!mismoLugar(vecina.coordenadas[posicion], vieja)) return;
    nuevas[indice] = { ...vecina, coordenadas: vecina.coordenadas.map((punto, i) =>
      i === posicion ? [...nueva] : punto) };
  }

  for (const [indice, parte] of partes.entries()) {
    if (parte.tipo !== "sobre_camino" || parte.caminoId !== anterior.id) {
      continue;
    }
    const esLaUltima = indice === partes.length - 1;
    const largoAnteriorM = largoDeLinea(anterior.coordenadas);
    const finalAnteriorM = parte.sentido === "ida" ? parte.hastaM : parte.desdeM;
    const terminabaEnPunta = finalAnteriorM !== null
      && (Math.abs(finalAnteriorM) <= REDONDEO_METROS
        || Math.abs(finalAnteriorM - largoAnteriorM) <= REDONDEO_METROS);
    if (esLaUltima && terminabaEnPunta) {
      const trasladado = trasladarFinalSobreCamino(parte, anterior, actual, finalYaSeparado);
      if (!trasladado.ok) return trasladado;
      nuevas[indice] = trasladado.datos.parte;
      if (trasladado.datos.parte) {
        moverUnionLibre(indice - 1, parte.coordenadas[0], trasladado.datos.parte.coordenadas[0], "final");
      }
      if (trasladado.datos.separacionM > MISMO_LUGAR_METROS) {
        finalSeparado = trasladado.datos.lugarConservado;
        separacionFinalM = trasladado.datos.separacionM;
      } else {
        finalSeparado = null;
      }
      continue;
    }
    const trasladada = trasladarParteSobreCamino(parte, anterior, actual);
    if (!trasladada.ok) return trasladada;
    nuevas[indice] = trasladada.datos;
    moverUnionLibre(indice - 1, parte.coordenadas[0], trasladada.datos.coordenadas[0], "final");
    moverUnionLibre(indice + 1, parte.coordenadas.at(-1)!, trasladada.datos.coordenadas.at(-1)!, "inicio");
  }
  return exito({ partes: nuevas.filter((parte): parte is ParteDibujada => parte !== null), finalSeparado, separacionFinalM });
}
