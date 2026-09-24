"use client";

import { useEffect, useState } from "react";
import { leerFoto } from "@/lib/anotaciones/deposito";

/**
 * La foto chica de una anotación, leída del celular. **Nunca de internet.**
 *
 * Tres respuestas, y ninguna queda muda: `buscando`, la dirección para
 * mostrarla, o `no_esta` cuando la foto no está bajada.
 */

export type FotoDelCelular =
  | { paso: "no_tiene" }
  | { paso: "buscando" }
  | { paso: "esta"; direccion: string }
  | { paso: "no_esta" };

/**
 * Lo encontrado va pegado a **de qué foto era**: mientras no coincidan se
 * muestra «buscando». Si no, al abrir otra anotación se vería por un instante
 * la foto de la anterior.
 */
type LoEncontrado = { para: string; direccion: string | null };

export function useFotoDelCelular(direccionGuardada: string | null): FotoDelCelular {
  const [encontrado, setEncontrado] = useState<LoEncontrado | null>(null);

  useEffect(() => {
    if (!direccionGuardada) return;

    let vigente = true;
    let creada: string | null = null;

    void (async () => {
      const guardada = await leerFoto(direccionGuardada);
      if (!vigente) return;
      creada = guardada ? URL.createObjectURL(guardada) : null;
      setEncontrado({ para: direccionGuardada, direccion: creada });
    })();

    return () => {
      vigente = false;
      // La dirección ocupa memoria hasta que se suelta.
      if (creada) URL.revokeObjectURL(creada);
    };
  }, [direccionGuardada]);

  if (!direccionGuardada) return { paso: "no_tiene" };
  if (encontrado?.para !== direccionGuardada) return { paso: "buscando" };
  return encontrado.direccion
    ? { paso: "esta", direccion: encontrado.direccion }
    : { paso: "no_esta" };
}
