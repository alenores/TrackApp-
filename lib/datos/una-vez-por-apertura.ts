/**
 * Lo que se le pide a la base **una sola vez por apertura** de la app.
 *
 * Decisión de Ale del 2026-10-13: con la app abierta, entrar otra vez a una
 * pantalla no vuelve a preguntarle a la base. La primera vez se pide fresco;
 * después se reusa lo que llegó hasta que la app se cierre y se vuelva a abrir.
 *
 * **Solo se guarda lo que salió bien.** Una falla no queda guardada: la
 * próxima vez que se entre, se vuelve a intentar.
 *
 * Cuando el usuario guarda algo, se olvida todo (`olvidarLoDeEstaApertura`),
 * así lo que acaba de guardar aparece al instante.
 */

type ConExito = { ok: boolean };

const guardado = new Map<string, Promise<ConExito>>();

export function unaVezPorApertura<T extends ConExito>(clave: string, pedir: () => Promise<T>): Promise<T> {
  const yaPedido = guardado.get(clave);
  if (yaPedido) return yaPedido as Promise<T>;

  const nuevo = pedir().then(
    (resultado) => {
      if (!resultado.ok) guardado.delete(clave);
      return resultado;
    },
    (causa: unknown) => {
      guardado.delete(clave);
      throw causa;
    },
  );
  guardado.set(clave, nuevo);
  return nuevo;
}

/** Se guardó algo: lo próximo que se pida, llega fresco. */
export function olvidarLoDeEstaApertura(): void {
  guardado.clear();
}
