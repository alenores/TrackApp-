export const COLORES_DE_RUTA = [
  { clave: "rojo", hex: "#ef4444", nombre: "Rojo" },
  { clave: "naranja", hex: "#f97316", nombre: "Naranja" },
  { clave: "amarillo", hex: "#eab308", nombre: "Amarillo" },
  { clave: "verde", hex: "#22c55e", nombre: "Verde" },
  { clave: "celeste", hex: "#0ea5e9", nombre: "Celeste" },
  { clave: "azul", hex: "#3b82f6", nombre: "Azul" },
  { clave: "morado", hex: "#a855f7", nombre: "Morado" },
  { clave: "fucsia", hex: "#ec4899", nombre: "Fucsia" },
  { clave: "oscuro", hex: "#171717", nombre: "Oscuro" },
] as const;

export type ColorDeRuta = typeof COLORES_DE_RUTA[number]["clave"];

export function hexDeLaRuta(clave: string | null): string {
  const encontrado = COLORES_DE_RUTA.find((c) => c.clave === clave);
  return encontrado ? encontrado.hex : "#f97316";
}
