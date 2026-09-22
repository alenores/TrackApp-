import type { Rectangulo } from "@/types/database";
import { rectanguloQueAbarca } from "@/lib/datos/rectangulo";

export type OpcionDeFraccionamiento = {
  filas: number;
  columnas: number;
};

// 0.002 grados son aproximadamente 200 metros (depende de la latitud, pero es un buen promedio para el solapamiento).
const SOLAPAMIENTO = 0.002;

export function calcularCuadricula(
  zona: Rectangulo,
  filas: number,
  columnas: number
): { rectangulo: Rectangulo; fila: number; columna: number }[] {
  const altoTodaLaZona = Math.abs(zona.latNorte - zona.latSur);
  const anchoTodaLaZona = Math.abs(zona.lonEste - zona.lonOeste);

  const altoPorFila = altoTodaLaZona / filas;
  const anchoPorColumna = anchoTodaLaZona / columnas;

  const sectores: { rectangulo: Rectangulo; fila: number; columna: number }[] = [];

  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      // Norte: latNorte es el valor mayor. Vamos restando para ir hacia el sur.
      const limiteNorte = zona.latNorte - f * altoPorFila + (f > 0 ? SOLAPAMIENTO : 0);
      
      const limiteSur = zona.latNorte - (f + 1) * altoPorFila - (f < filas - 1 ? SOLAPAMIENTO : 0);
      
      // Oeste: lonOeste es el valor menor (más negativo). Vamos sumando para ir al este.
      const limiteOeste = zona.lonOeste + c * anchoPorColumna - (c > 0 ? SOLAPAMIENTO : 0);
      
      const limiteEste = zona.lonOeste + (c + 1) * anchoPorColumna + (c < columnas - 1 ? SOLAPAMIENTO : 0);

      const rect = rectanguloQueAbarca([
        [limiteOeste, limiteNorte],
        [limiteEste, limiteSur]
      ]);

      if (rect) {
        sectores.push({
          rectangulo: rect,
          fila: f + 1, // 1-indexed (ej: 1, 2, 3)
          columna: c + 1 // 1-indexed (ej: 1 = A, 2 = B)
        });
      }
    }
  }

  return sectores;
}
