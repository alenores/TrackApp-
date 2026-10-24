"use client";

import { useState } from "react";
import { Emergente, BotonDeEmergente } from "@/components/ui/emergente";
import { MenuDeAcciones } from "@/components/ui/menu-de-acciones";
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
      : "Marca";

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
      alCostado
      acciones={
        anotacion && fotoRemotaNecesaria && falloDeFotoRemota ? (
          <BotonDeEmergente onClick={() => setFotoRemotaFallida(null)}>Volver a intentar</BotonDeEmergente>
        ) : undefined
      }
    >
      <div className="space-y-3">
        {anotacion && (mostrarAutor || alCambiar) ? (
          // Los tres puntos, discretos arriba a la derecha del cuerpo: solo
          // para quien puede cambiar la marca.
          <div className="flex items-start gap-2">
            {mostrarAutor ? (
              <p className="min-w-0 flex-1 text-base text-texto-suave">
                {deQuien(anotacion, miPerfilId)}
                {marcadaEl ? ` · marcada el ${marcadaEl}` : ""}
                {anotacion.precisionGpsMetros !== null
                  ? ` · GPS ±${anotacion.precisionGpsMetros} m`
                  : ""}
              </p>
            ) : null}
            {alCambiar ? (
              <MenuDeAcciones
                className="ml-auto shrink-0"
                etiqueta={`Opciones de ${titulo}`}
                acciones={[
                  { etiqueta: "Editar", alElegir: () => alCambiar(anotacion) },
                  { etiqueta: "Eliminar", destructiva: true, alElegir: () => alBorrar?.(anotacion) },
                ]}
              />
            ) : null}
          </div>
        ) : null}

        {anotacion?.atencion ? (
          // El mismo rojo del contorno en el mapa. El motivo va en la descripción.
          <p className="rounded-xl border-2 border-rojo px-3 py-2 text-lg font-semibold text-texto">
            Atención
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
                ? "La marca ya se subió, pero la foto todavía no. Se reintenta sola cuando tengas señal."
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
            Esta marca tiene una foto, pero no está en el celular. Desde
            casa, con señal, abrí el inicio y bajá las fotos que faltan.
          </p>
        ) : null}

        {tieneSoloLaGrande && !fotoRemotaNecesaria ? (
          <p className="rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-3 text-lg leading-7 text-ambar-texto">
            Esta marca tiene una foto que solo se ve con internet, en la
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
            Esta marca no tiene ni foto ni comentario: marca nomás el lugar.
          </p>
        ) : null}
      </div>
    </Emergente>
  );
}
