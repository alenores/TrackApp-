import type { ActividadTipo } from "@/types/database";

export type ActividadMeta = {
  tipo: ActividadTipo;
  label: string;
  icon: string;
};

export const ACTIVIDADES: ActividadMeta[] = [
  { tipo: "trekking", label: "Trekking", icon: "🥾" },
  { tipo: "correr", label: "Correr", icon: "🏃" },
  { tipo: "mountain_bike", label: "Mountain Bike", icon: "🚵" },
  { tipo: "moto", label: "Moto", icon: "🏍️" },
  { tipo: "camioneta", label: "Camioneta", icon: "🚙" },
  { tipo: "canyoning", label: "Canyoning", icon: "🧗" },
  { tipo: "kayak", label: "Kayak", icon: "🛶" },
];

export function getActividadMeta(tipo: ActividadTipo): ActividadMeta {
  return ACTIVIDADES.find((a) => a.tipo === tipo) ?? { tipo, label: tipo, icon: "📍" };
}
