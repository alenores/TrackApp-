/**
 * Lo que devuelve cualquier acción que escribe en la base.
 *
 * Nunca se lanza una excepción hacia la pantalla: la pantalla tiene que poder
 * mostrar qué pasó y qué hacer. Un error atrapado que no se muestra es una
 * falla invisible.
 */

export type Resultado<T = void> =
  | ({ ok: true } & (T extends void ? Record<never, never> : { datos: T }))
  | { ok: false; error: string };

export function exito(): Resultado;
export function exito<T>(datos: T): Resultado<T>;
export function exito<T>(datos?: T) {
  return datos === undefined ? { ok: true } : { ok: true, datos };
}

export function falla(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

/**
 * Traduce el error crudo de la base a algo que una persona pueda leer y actuar.
 *
 * Prohibido «algo salió mal»: el mensaje dice qué pasó y qué hacer. Cuando no
 * se reconoce el error se devuelve el motivo real, que es feo pero sirve para
 * arreglarlo.
 */
export function traducirErrorDeBase(mensaje: string): string {
  const texto = mensaje.toLowerCase();

  if (texto.includes("row-level security") || texto.includes("permission denied")) {
    return "No tenés permiso para hacer esto. Si creés que deberías tenerlo, avisale a Ale.";
  }

  if (texto.includes("rectangulo_valido")) {
    return "El rectángulo está dado vuelta: la esquina noroeste tiene que quedar arriba y a la izquierda de la sudeste. Revisá las coordenadas que pegaste.";
  }

  if (texto.includes("al_menos_una_actividad")) {
    return "Elegí al menos un tipo de actividad para la ruta.";
  }

  if (texto.includes("dificultad_rango")) {
    return "La dificultad técnica va del 1 al 10.";
  }

  if (texto.includes("anotaciones_forma_coherente")) {
    return "Un punto lleva ícono y un trazo lleva color. Revisá qué estás cargando.";
  }

  if (texto.includes("violates foreign key")) {
    return "Estás apuntando a algo que ya no existe. Recargá la pantalla y probá de nuevo.";
  }

  if (texto.includes("duplicate key")) {
    return "Eso ya existe.";
  }

  if (texto.includes("not-null") || texto.includes("null value in column")) {
    return "Falta completar un dato obligatorio.";
  }

  return mensaje;
}
