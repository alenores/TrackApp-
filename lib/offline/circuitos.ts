import type { FeatureCollection, LineString, Position } from "geojson";
import type { Rectangulo, ActividadRuta } from "@/types/database";
import type { ResumenDelCircuito } from "@/lib/circuitos/resumen";
import { ESTANTES, escribirEnElDeposito, leerDelDeposito } from "@/lib/offline/deposito";

export type CircuitoSinDibujo = {
  id: number;
  nombre: string;
  actividad: ActividadRuta;
  actualizadoEn: string;
  rectangulo: Rectangulo | null;
};

export type CircuitoPreparado = {
  id: number;
  actualizadoEn: string;
  dibujo: FeatureCollection<LineString>;
  resumen: ResumenDelCircuito;
  finalSeparado: Position | null;
};

export function claveDeCircuito(circuito: Pick<CircuitoSinDibujo, "id" | "actualizadoEn">): string {
  return `${circuito.id}:${circuito.actualizadoEn}`;
}

/** Primero quedan todos los dibujos en una transacción; después se publica la lista liviana. */
export async function guardarCircuitosPreparados(circuitos: CircuitoPreparado[]): Promise<boolean> {
  try {
    await escribirEnElDeposito(ESTANTES.circuitosPreparados,
      circuitos.map((circuito) => (donde) => donde.put(circuito, claveDeCircuito(circuito))));
    return true;
  } catch {
    return false;
  }
}

export async function leerCircuitoPreparado(circuito: CircuitoSinDibujo): Promise<CircuitoPreparado | null> {
  try {
    return await leerDelDeposito<CircuitoPreparado | undefined>(ESTANTES.circuitosPreparados,
      (donde) => donde.get(claveDeCircuito(circuito))) ?? null;
  } catch {
    return null;
  }
}

export async function borrarCircuitosPreparadosQueSobran(vigentes: CircuitoSinDibujo[]): Promise<void> {
  try {
    const claves = new Set(vigentes.map(claveDeCircuito));
    const guardadas = await leerDelDeposito<IDBValidKey[]>(ESTANTES.circuitosPreparados,
      (donde) => donde.getAllKeys());
    await escribirEnElDeposito(ESTANTES.circuitosPreparados,
      guardadas.filter((clave): clave is string => typeof clave === "string" && !claves.has(clave))
        .map((clave) => (donde) => donde.delete(clave)));
  } catch {
    // Una limpieza fallida no quita el Circuito vigente.
  }
}
