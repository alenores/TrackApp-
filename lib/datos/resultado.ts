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

  if (
    texto.includes("failed to fetch") ||
    texto.includes("fetch failed") ||
    texto.includes("networkerror") ||
    texto.includes("load failed")
  ) {
    return "No hubo conexión con la base: la señal no alcanzó. Se vuelve a intentar sola; con buena señal podés probar de nuevo.";
  }

  return mensaje;
}

/**
 * Traduce el error del sistema de cuentas.
 *
 * Es otro sistema que el de la base y habla en inglés. Sus mensajes llegaban
 * tal cual a la pantalla —«Error updating user»— y no le decían al usuario ni
 * qué pasó ni qué hacer.
 *
 * Cuando el mensaje no se reconoce **viaja adentro igual**: feo, pero es lo
 * único que después permite arreglarlo.
 */
export function traducirErrorDeLaCuenta(mensaje: string): string {
  const texto = mensaje.toLowerCase();

  if (texto.includes("already been registered") || texto.includes("already exists")) {
    return "Ese email ya está usado por otra cuenta. Probá con otro.";
  }

  if (texto.includes("invalid") && texto.includes("email")) {
    return "Ese email no se entiende. Fijate que esté bien escrito.";
  }

  if (texto.includes("rate limit") || texto.includes("for security purposes")) {
    return "Probaste muchas veces seguidas. Esperá un minuto y volvé a intentar.";
  }

  if (texto.includes("email") && texto.includes("not confirmed")) {
    return "Todavía no confirmaste el email. Buscá el mensaje que te llegó y tocá el enlace.";
  }

  return `No se pudo cambiar el email de la cuenta: ${mensaje}. Si sigue pasando, avisale a Ale con este mensaje.`;
}
