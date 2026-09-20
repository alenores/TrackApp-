"use client";

import { useEffect, useState } from "react";
import { Emergente, BotonDeEmergente } from "@/components/ui/emergente";
import { leerFoto } from "@/lib/anotaciones/deposito";
import { COMO_SE_LLAMA } from "@/lib/anotaciones/iconos";
import type { Anotacion } from "@/types/database";

/**
 * La ficha de una anotación, abierta desde el mapa mientras se navega.
 *
 * **Es el momento para el que existe la foto.** La persona está parada en el
 * cruce, sin señal, y necesita ver cómo es de verdad el lugar. Por eso la foto
 * sale del celular y nunca de internet.
 *
 * Tiene tres estados y **ninguno queda mudo**: mientras busca la foto, cuando
 * la encuentra, y cuando no está bajada. Ese último es el que importa: un
 * recuadro vacío haría pensar que la foto no existe, cuando lo que pasa es que
 * quedó en casa.
 */

type PropiedadesDeLaFicha = {
  anotacion: Anotacion | null;
  alCerrar: () => void;
};

type Foto =
  | { paso: "buscando" }
  | { paso: "esta"; direccion: string }
  | { paso: "no_esta" }
  | { paso: "no_tiene" };

/**
 * Lo encontrado, junto con **de qué foto era**.
 *
 * Van pegados a propósito: mientras no coincidan, lo que se muestra es
 * «buscando». Guardar el paso por separado haría que, al abrir la segunda
 * anotación, por un instante se viera la foto de la primera.
 */
type LoEncontrado = { para: string; direccion: string | null };

export function FichaDeAnotacion({ anotacion, alCerrar }: PropiedadesDeLaFicha) {
  const [encontrado, setEncontrado] = useState<LoEncontrado | null>(null);
  const fotoUrl = anotacion?.fotoUrl ?? null;

  useEffect(() => {
    if (!fotoUrl) return;

    let vigente = true;
    let direccionCreada: string | null = null;

    void (async () => {
      const guardada = await leerFoto(fotoUrl);

      if (!vigente) return;

      direccionCreada = guardada ? URL.createObjectURL(guardada) : null;
      setEncontrado({ para: fotoUrl, direccion: direccionCreada });
    })();

    return () => {
      vigente = false;
      // La dirección de la foto ocupa memoria hasta que se suelta.
      if (direccionCreada) URL.revokeObjectURL(direccionCreada);
    };
  }, [fotoUrl]);

  const foto: Foto = !fotoUrl
    ? { paso: "no_tiene" }
    : encontrado?.para !== fotoUrl
      ? { paso: "buscando" }
      : encontrado.direccion
        ? { paso: "esta", direccion: encontrado.direccion }
        : { paso: "no_esta" };

  const titulo = anotacion?.icono
    ? COMO_SE_LLAMA[anotacion.icono]
    : "Anotación";

  return (
    <Emergente
      abierto={anotacion !== null}
      alCerrar={alCerrar}
      titulo={titulo}
      ancho="amplio"
      acciones={<BotonDeEmergente onClick={alCerrar}>Cerrar</BotonDeEmergente>}
    >
      <div className="space-y-3">
        {foto.paso === "buscando" ? (
          <div className="flex min-h-40 items-center justify-center rounded-xl border border-borde-suave bg-fondo px-3 text-base text-texto-suave">
            Buscando la foto en el celular…
          </div>
        ) : null}

        {foto.paso === "esta" ? (
          // Se usa la etiqueta de siempre y no la del framework: esta foto sale
          // del celular, no de internet, y no hay nada que optimizar ni servir.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={foto.direccion}
            alt={
              anotacion?.comentario
                ? `Foto de ${titulo}: ${anotacion.comentario}`
                : `Foto de ${titulo}`
            }
            className="w-full rounded-xl border border-borde-suave bg-fondo"
          />
        ) : null}

        {foto.paso === "no_esta" ? (
          <p
            role="alert"
            className="rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-3 text-base leading-6 text-ambar-texto"
          >
            Esta anotación tiene una foto, pero no está bajada en el celular.
            Desde casa, con señal, entrá al sector y bajá las fotos que faltan.
          </p>
        ) : null}

        {anotacion?.comentario ? (
          <p className="text-lg leading-7 text-texto">{anotacion.comentario}</p>
        ) : foto.paso === "no_tiene" ? (
          <p className="text-base leading-6 text-texto-suave">
            Esta anotación no tiene ni foto ni comentario: marca nomás el lugar.
          </p>
        ) : null}
      </div>
    </Emergente>
  );
}
