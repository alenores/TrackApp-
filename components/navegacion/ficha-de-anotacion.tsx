"use client";

import { useState } from "react";
import { Emergente, BotonDeEmergente } from "@/components/ui/emergente";
import { useFotoDelCelular } from "@/hooks/use-foto-del-celular";
import { COMO_SE_LLAMA } from "@/lib/anotaciones/iconos";
import type { AnotacionEnPantalla } from "@/lib/anotaciones/en-pantalla";

/**
 * La ficha compartida de una anotación, abierta desde un mapa.
 *
 * Durante la navegación muestra la foto chica guardada en el celular y nunca
 * sale a internet. En otros mapas puede abrir la foto completa si la copia
 * local falta y esa pantalla tiene conexión.
 *
 * **Nada queda mudo**: mientras busca la foto, cuando no está bajada, y cuando
 * algo de esta anotación todavía no se subió —con el motivo si falló—.
 */

type PropiedadesDeLaFicha = {
  anotacion: AnotacionEnPantalla | null;
  alCerrar: () => void;
  miPerfilId: string | null;
  mostrarAutor?: boolean;
  /** Solo en mapas de administración con conexión, nunca durante navegación. */
  fotoRemotaAlFaltar?: boolean;
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
  mostrarAutor = true,
  fotoRemotaAlFaltar = false,
  alCambiar,
  alBorrar,
}: PropiedadesDeLaFicha) {
  const foto = useFotoDelCelular(anotacion?.fotoChicaUrl ?? null);
  const [fotoRemotaFallida, setFotoRemotaFallida] = useState<string | null>(null);

  const titulo = anotacion?.icono
    ? COMO_SE_LLAMA[anotacion.icono]
    : anotacion?.tipo === "trazo"
      ? "Trazo"
      : "Anotación";

  // Tiene foto grande pero no chica: se subió antes de que existiera la chica.
  const tieneSoloLaGrande = Boolean(anotacion?.fotoUrl) && !anotacion?.fotoChicaUrl;
  const fotoRemotaNecesaria = Boolean(
    anotacion?.fotoUrl && (tieneSoloLaGrande || foto.paso === "no_esta") && fotoRemotaAlFaltar,
  );
  const falloDeFotoRemota = fotoRemotaNecesaria && fotoRemotaFallida === anotacion?.fotoUrl;
  const marcadaEl = anotacion ? cuando(anotacion.marcadaEn) : null;

  return (
    <Emergente
      abierto={anotacion !== null}
      alCerrar={alCerrar}
      titulo={titulo}
      ancho="amplio"
      acciones={
        <div className="w-full space-y-2">
          {anotacion && fotoRemotaNecesaria && falloDeFotoRemota ? (
            <BotonDeEmergente onClick={() => setFotoRemotaFallida(null)}>Volver a intentar</BotonDeEmergente>
          ) : null}
          {anotacion && alCambiar ? (
            <div className="grid grid-cols-2 gap-2">
              <BotonDeEmergente
                variante="secundario"
                onClick={() => alCambiar(anotacion)}
              >
                Cambiar
              </BotonDeEmergente>
              <BotonDeEmergente
                variante="destructivo"
                onClick={() => alBorrar?.(anotacion)}
              >
                Borrar
              </BotonDeEmergente>
            </div>
          ) : null}
          <BotonDeEmergente onClick={alCerrar}>
            Cerrar
          </BotonDeEmergente>
        </div>
      }
    >
      <div className="space-y-3">
        {anotacion && mostrarAutor ? (
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

        {fotoRemotaNecesaria && !falloDeFotoRemota ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={anotacion?.fotoUrl ?? undefined}
            alt={anotacion?.comentario ? `Foto de ${titulo}: ${anotacion.comentario}` : `Foto de ${titulo}`}
            onError={() => setFotoRemotaFallida(anotacion?.fotoUrl ?? null)}
            className="w-full rounded-xl border border-borde-suave bg-fondo"
          />
        ) : null}

        {foto.paso === "no_esta" && !fotoRemotaNecesaria ? (
          <p
            role="alert"
            className="rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-3 text-lg leading-7 text-ambar-texto"
          >
            Esta anotación tiene una foto, pero no está en el celular. Desde
            casa, con señal, abrí el inicio y bajá las fotos que faltan.
          </p>
        ) : null}

        {tieneSoloLaGrande && !fotoRemotaNecesaria ? (
          <p className="rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-3 text-lg leading-7 text-ambar-texto">
            Esta anotación tiene una foto que solo se ve con internet, en la
            pantalla del sector. Hay que volver a cargarla para que viaje al
            celular.
          </p>
        ) : null}

        {fotoRemotaNecesaria && falloDeFotoRemota ? (
          <p role="alert" className="rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-3 text-lg leading-7 text-ambar-texto">
            No se pudo abrir la foto. Revisá la conexión y volvé a intentar.
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
