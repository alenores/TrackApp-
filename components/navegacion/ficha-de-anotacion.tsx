"use client";

import { Emergente, BotonDeEmergente } from "@/components/ui/emergente";
import { useFotoDelCelular } from "@/hooks/use-foto-del-celular";
import { COMO_SE_LLAMA } from "@/lib/anotaciones/iconos";
import type { AnotacionEnPantalla } from "@/lib/anotaciones/en-pantalla";

/**
 * La ficha de una anotación, abierta desde el mapa mientras se navega.
 *
 * **Es el momento para el que existe la foto.** La persona está parada en el
 * cruce, sin señal, y necesita ver cómo es de verdad el lugar. Por eso se
 * muestra la foto chica, que está en el celular, y nunca se sale a internet.
 *
 * **Nada queda mudo**: mientras busca la foto, cuando no está bajada, y cuando
 * algo de esta anotación todavía no se subió —con el motivo si falló—.
 */

type PropiedadesDeLaFicha = {
  anotacion: AnotacionEnPantalla | null;
  alCerrar: () => void;
  miPerfilId: string | null;
  /** Aparece solo si la podés cambiar: las tuyas, o todas si sos administrador. */
  alCambiar?: (anotacion: AnotacionEnPantalla) => void;
  alBorrar?: (anotacion: AnotacionEnPantalla) => void;
};

function deQuien(anotacion: AnotacionEnPantalla, miPerfilId: string | null): string {
  if (miPerfilId !== null && anotacion.perfilId === miPerfilId) return "Tuya";
  return anotacion.deAdministrador ? "Del administrador" : "De otro usuario";
}

function cuando(fecha: string): string | null {
  const momento = new Date(fecha);
  if (Number.isNaN(momento.getTime())) return null;
  return momento.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

export function FichaDeAnotacion({
  anotacion,
  alCerrar,
  miPerfilId,
  alCambiar,
  alBorrar,
}: PropiedadesDeLaFicha) {
  const foto = useFotoDelCelular(anotacion?.fotoChicaUrl ?? null);

  const titulo = anotacion?.icono
    ? COMO_SE_LLAMA[anotacion.icono]
    : anotacion?.tipo === "trazo"
      ? "Trazo"
      : "Anotación";

  // Tiene foto grande pero no chica: se subió antes de que existiera la chica.
  const tieneSoloLaGrande = Boolean(anotacion?.fotoUrl) && !anotacion?.fotoChicaUrl;
  const marcadaEl = anotacion ? cuando(anotacion.marcadaEn) : null;

  return (
    <Emergente
      abierto={anotacion !== null}
      alCerrar={alCerrar}
      titulo={titulo}
      ancho="amplio"
      acciones={
        <div className="w-full space-y-2">
          {anotacion && alCambiar ? (
            <div className="grid grid-cols-2 gap-2">
              <BotonDeEmergente
                variante="secundario"
                paraNavegacion
                onClick={() => alCambiar(anotacion)}
              >
                Cambiar
              </BotonDeEmergente>
              <BotonDeEmergente
                variante="destructivo"
                paraNavegacion
                onClick={() => alBorrar?.(anotacion)}
              >
                Borrar
              </BotonDeEmergente>
            </div>
          ) : null}
          <BotonDeEmergente paraNavegacion onClick={alCerrar}>
            Cerrar
          </BotonDeEmergente>
        </div>
      }
    >
      <div className="space-y-3">
        {anotacion ? (
          <p className="text-base text-texto-suave">
            {deQuien(anotacion, miPerfilId)}
            {marcadaEl ? ` · marcada el ${marcadaEl}` : ""}
            {anotacion.precisionGpsMetros !== null
              ? ` · GPS ±${anotacion.precisionGpsMetros} m`
              : ""}
          </p>
        ) : null}

        {anotacion?.subida ? (
          <p
            role="status"
            className="rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-3 text-lg leading-7 text-ambar-texto"
          >
            {anotacion.subida.clase === "sin_subir"
              ? "Todavía no se subió: está guardada en este celular y se sube sola cuando tengas señal."
              : anotacion.subida.clase === "foto_sin_subir"
                ? "La anotación ya se subió, pero la foto todavía no. Se reintenta sola cuando tengas señal."
                : "Este cambio todavía no se subió. Se sube solo cuando tengas señal."}
            {anotacion.subida.motivo ? ` Último intento: ${anotacion.subida.motivo}` : ""}
          </p>
        ) : null}

        {foto.paso === "buscando" ? (
          <div className="flex min-h-40 items-center justify-center rounded-xl border border-borde-suave bg-fondo px-3 text-lg text-texto-suave">
            Buscando la foto en el celular…
          </div>
        ) : null}

        {foto.paso === "esta" ? (
          // La etiqueta de siempre y no la del framework: esta foto sale del
          // celular, no de internet, y no hay nada que optimizar.
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
            className="rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-3 text-lg leading-7 text-ambar-texto"
          >
            Esta anotación tiene una foto, pero no está en el celular. Desde
            casa, con señal, abrí el inicio y bajá las fotos que faltan.
          </p>
        ) : null}

        {tieneSoloLaGrande ? (
          <p className="rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-3 text-lg leading-7 text-ambar-texto">
            Esta anotación tiene una foto que solo se ve con internet, en la
            pantalla del sector. Hay que volver a cargarla para que viaje al
            celular.
          </p>
        ) : null}

        {anotacion?.comentario ? (
          <p className="text-lg leading-7 text-texto">{anotacion.comentario}</p>
        ) : foto.paso === "no_tiene" && !tieneSoloLaGrande ? (
          <p className="text-lg leading-7 text-texto-suave">
            Esta anotación no tiene ni foto ni comentario: marca nomás el lugar.
          </p>
        ) : null}
      </div>
    </Emergente>
  );
}
