import type { FeatureCollection, LineString, Point } from "geojson";

/**
 * Tipos del dominio de TrackApp.
 *
 * La base guarda los nombres en snake_case español (ver docs/SCHEMA.md).
 * Acá viven los objetos del dominio, en camelCase, que es lo que usa el resto
 * de la app. La traducción entre una forma y la otra ocurre en un solo lugar:
 * los archivos `datos.ts` de cada módulo.
 */

// ---------------------------------------------------------------- categorías

export type CategoriaUsuario = "administrador" | "premium" | "normal";

export const CATEGORIAS_USUARIO: CategoriaUsuario[] = [
  "administrador",
  "premium",
  "normal",
];

export type ActividadRuta =
  | "trekking"
  | "mountain_bike"
  | "kayak"
  | "canyoning";

export const ACTIVIDADES_RUTA: ActividadRuta[] = [
  "trekking",
  "mountain_bike",
  "kayak",
  "canyoning",
];

export type NivelEsfuerzo = "bajo" | "medio" | "alto" | "muy_alto";

export const NIVELES_ESFUERZO: NivelEsfuerzo[] = [
  "bajo",
  "medio",
  "alto",
  "muy_alto",
];

export type TipoAnotacion = "punto" | "trazo";

export type IconoPunto =
  | "refugio"
  | "arroyo"
  | "cumbre"
  | "puente"
  | "pueblo"
  | "cartel"
  | "fuente"
  | "iglesia"
  | "cruce"
  | "mirador"
  | "cascada";

export const ICONOS_PUNTO: IconoPunto[] = [
  "refugio",
  "arroyo",
  "cumbre",
  "puente",
  "pueblo",
  "cartel",
  "fuente",
  "iglesia",
  "cruce",
  "mirador",
  "cascada",
];

// ---------------------------------------------------------------- geometría

/**
 * Rectángulo alineado al norte, definido por dos esquinas: la noroeste
 * (latNorte, lonOeste) y la sudeste (latSur, lonEste).
 *
 * En Argentina los cuatro números son negativos, y siempre se cumple que
 * latNorte > latSur y lonEste > lonOeste.
 */
export type Rectangulo = {
  latNorte: number;
  latSur: number;
  lonEste: number;
  lonOeste: number;
};

// ---------------------------------------------------------------- entidades

export type Perfil = {
  id: string;
  nombre: string | null;
  avatarUrl: string | null;
  categoria: CategoriaUsuario;
  creadoEn: string;
  actualizadoEn: string;
};

export type Zona = {
  id: number;
  perfilId: string;
  nombre: string;
  descripcion: string | null;
  rectangulo: Rectangulo;
  creadoEn: string;
  actualizadoEn: string;
};

export type Sector = {
  id: number;
  zonaId: number;
  perfilId: string;
  nombre: string;
  descripcion: string | null;
  rectangulo: Rectangulo;
  creadoEn: string;
  actualizadoEn: string;
};

/** Lo que alcanza para dibujar una ruta en una lista, sin traer la geometría. */
export type RutaResumen = {
  id: number;
  perfilId: string;
  nombre: string;
  descripcion: string | null;
  actividades: ActividadRuta[];
  dificultadTecnica: number | null;
  nivelEsfuerzo: NivelEsfuerzo | null;
  largoKm: number | null;
  desnivelPositivoM: number | null;
  desnivelNegativoM: number | null;
  rectangulo: Rectangulo;
  creadoEn: string;
  actualizadoEn: string;
};

/**
 * Todo lo de una ruta menos la línea del recorrido.
 *
 * Esto es lo que se guarda en el celular: qué llevar y qué complicaciones tiene
 * la ruta hay que poder leerlos **en el cerro**, que es justo donde no hay
 * señal. La línea viaja aparte porque pesa miles de veces más.
 */
export type RutaSinRecorrido = RutaResumen & {
  comentario: string | null;
  equipo: string | null;
  complicaciones: string | null;
  archivoUrl: string | null;
};

/** La ruta completa, con la línea del recorrido. */
export type Ruta = RutaSinRecorrido & {
  geometria: FeatureCollection;
};

export type Anotacion = {
  id: number;
  sectorId: number;
  perfilId: string;
  tipo: TipoAnotacion;
  /** Solo cuando `tipo` es `punto`. */
  icono: IconoPunto | null;
  /** Solo cuando `tipo` es `trazo`. */
  color: string | null;
  comentario: string | null;
  /**
   * La foto del lugar, cuando la hay.
   *
   * Sirve para lo que un mapa no puede mostrar: si el vado se cruza, si el
   * desvío existe, cómo es el cruce de verdad. Viaja con el paquete offline.
   */
  fotoUrl: string | null;
  geometria: Point | LineString;
  creadoEn: string;
  actualizadoEn: string;
};
