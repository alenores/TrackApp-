/**
 * El calendario de salidas, sin nada de pantalla: armar la grilla de un mes y
 * moverse entre meses. La semana empieza el lunes, como se usa acá.
 */

/** «2026-10». */
export type Mes = { anio: number; mes: number };

export const DIAS_DE_LA_SEMANA = ["L", "M", "M", "J", "V", "S", "D"];

const NOMBRES_DE_LOS_MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function dosCifras(numero: number): string {
  return String(numero).padStart(2, "0");
}

/** «2026-10-04». */
export function diaComoTexto(anio: number, mes: number, dia: number): string {
  return `${anio}-${dosCifras(mes)}-${dosCifras(dia)}`;
}

/** «Octubre 2026». */
export function nombreDelMes({ anio, mes }: Mes): string {
  return `${NOMBRES_DE_LOS_MESES[mes - 1]} ${anio}`;
}

/** El mes de una fecha «2026-10-04». */
export function mesDe(dia: string): Mes {
  const [anio, mes] = dia.split("-").map(Number);
  return { anio, mes };
}

export function mesVecino({ anio, mes }: Mes, cuanto: 1 | -1): Mes {
  const total = anio * 12 + (mes - 1) + cuanto;
  return { anio: Math.floor(total / 12), mes: (total % 12) + 1 };
}

/** El primero y el último día del mes, para pedirle a la base. */
export function limitesDelMes({ anio, mes }: Mes): { desde: string; hasta: string } {
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  return { desde: diaComoTexto(anio, mes, 1), hasta: diaComoTexto(anio, mes, ultimo) };
}

/**
 * Las semanas del mes, de lunes a domingo. Los huecos antes del primero y
 * después del último van vacíos (`null`).
 */
export function semanasDelMes({ anio, mes }: Mes): (string | null)[][] {
  const dias = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  // getUTCDay: 0 es domingo. Se corre para que el lunes sea 0.
  const huecoInicial = (new Date(Date.UTC(anio, mes - 1, 1)).getUTCDay() + 6) % 7;

  const celdas: (string | null)[] = [
    ...Array.from({ length: huecoInicial }, () => null),
    ...Array.from({ length: dias }, (_, indice) => diaComoTexto(anio, mes, indice + 1)),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);

  const semanas: (string | null)[][] = [];
  for (let inicio = 0; inicio < celdas.length; inicio += 7) {
    semanas.push(celdas.slice(inicio, inicio + 7));
  }
  return semanas;
}
