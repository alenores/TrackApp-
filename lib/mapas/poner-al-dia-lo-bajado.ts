import { claveDeMapa, mapasBajados } from "@/lib/offline/mapas";
import {
  losSacadosAProposito,
  olvidarElSacado,
} from "@/lib/offline/sacados-a-proposito";
import {
  anotarQueBajasteElMapa,
  olvidarQueTeniasElMapa,
  traerLosMapasQueTenias,
} from "@/lib/supabase/mapas-bajados";

/**
 * Dejar la base al día con lo que de verdad hay en este celular.
 *
 * Corre con señal, apenas el paquete queda al día, y arregla lo que quedó a
 * medias: una descarga que no llegó a anotarse, un mapa que sacaste sin señal.
 *
 * **Va en un solo sentido: del celular a la base, y solo agregando.** Nunca se
 * borra de la base un mapa porque no esté en el celular — eso es justamente la
 * pérdida que hay que detectar. Si se borrara, la app se olvidaría del problema
 * en vez de avisarlo.
 *
 * **Nunca tira.** Es trabajo de fondo: si algo falla, la app sigue igual y se
 * reintenta la próxima vez que se abra con señal.
 */

export type ResultadoDePonerAlDia = {
  /** Descargas que la base no tenía anotadas y ahora sí. */
  anotadas: number;
  /** Sacados a propósito que estaban pendientes y la base ya aceptó. */
  avisados: number;
};

const NADA: ResultadoDePonerAlDia = { anotadas: 0, avisados: 0 };

export async function ponerAlDiaLoBajado(): Promise<ResultadoDePonerAlDia> {
  if (typeof window === "undefined") return NADA;

  // Primero los sacados: si un sector se sacó y se volvió a bajar, lo que vale
  // es la anotación nueva, y anotarla después del aviso la deja en pie.
  let avisados = 0;

  for (const { sectorId, tipo } of losSacadosAProposito()) {
    const resultado = await olvidarQueTeniasElMapa(sectorId, tipo);
    if (!resultado.ok) continue;

    olvidarElSacado(sectorId, tipo);
    avisados += 1;
  }

  const loQueTenias = await traerLosMapasQueTenias();
  if (loQueTenias.clase === "no_se_pudo") return { anotadas: 0, avisados };

  const yaAnotados = new Set(
    loQueTenias.mapas.map((cada) => claveDeMapa(cada.sectorId, cada.tipo)),
  );
  let anotadas = 0;

  for (const mapa of mapasBajados()) {
    if (yaAnotados.has(claveDeMapa(mapa.sectorId, mapa.tipo))) continue;

    const resultado = await anotarQueBajasteElMapa({
      sectorId: mapa.sectorId,
      tipo: mapa.tipo,
      acercamientoMaximo: mapa.acercamientoMaximo,
    });

    if (resultado.ok) anotadas += 1;
  }

  return { anotadas, avisados };
}
