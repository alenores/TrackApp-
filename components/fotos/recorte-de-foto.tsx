"use client";

import { useCallback, useMemo, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { BotonDeEmergente, Emergente } from "@/components/ui/emergente";
import { vibrarAlTocar } from "@/lib/vibracion";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";
import type { DestinoDeFoto, FotoAbierta, Recorte } from "@/lib/fotos/preparar";

/**
 * La pantalla de recortar una foto. **Es la única de la app.**
 *
 * Recibe la foto ya abierta —leída una sola vez— y devuelve qué pedazo quedó
 * elegido, en píxeles de la foto original. No convierte ni sube nada.
 *
 * **La forma la decide el destino, no la persona.** Donde la pantalla muestra
 * la foto con una forma fija (el círculo del perfil), el recorte es a esa
 * forma. Donde la foto se ve como vino, se puede elegir, con «Como vino»
 * primero.
 *
 * Se puede hacer zoom con dos dedos, pero **además hay botones grandes**: con
 * guantes puestos, un gesto de dos dedos no se acierta.
 */

export type ProporcionElegible = {
  etiqueta: string;
  /** Ancho dividido alto. `"como-vino"` es la proporción de la foto original. */
  valor: number | "como-vino";
};

export type FormaDeRecorte =
  | { tipo: "circulo" }
  | { tipo: "fija"; proporcion: number }
  | { tipo: "elegir"; opciones: readonly ProporcionElegible[] };

/**
 * La forma de cada destino, escrita **una sola vez**.
 *
 * Para sumar un destino nuevo se agrega un renglón acá y su ajuste de tamaño
 * en `lib/fotos/preparar`.
 */
export const FORMAS_DE_RECORTE = {
  /** La foto de perfil se ve siempre dentro de un círculo. */
  avatar: { tipo: "circulo" },
} as const satisfies Record<DestinoDeFoto, FormaDeRecorte>;

const ZOOM_MINIMO = 1;
const ZOOM_MAXIMO = 4;
const PASO_DE_ZOOM = 0.25;

type Props = {
  abierto: boolean;
  foto: FotoAbierta | null;
  forma: FormaDeRecorte;
  /** Mientras se prepara el recorte los botones se traban. */
  ocupado?: boolean;
  alCancelar: () => void;
  alConfirmar: (recorte: Recorte) => void;
};

export function RecorteDeFoto({ abierto, foto, ...resto }: Props) {
  if (!abierto || !foto) return null;

  // Cambia de clave con cada foto: así cada recorte arranca centrado, sin zoom
  // y en la primera opción, sin efectos que lo tengan que reacomodar.
  return <RecorteAbierto key={foto.url} foto={foto} {...resto} />;
}

function RecorteAbierto({
  foto,
  forma,
  ocupado = false,
  alCancelar,
  alConfirmar,
}: Omit<Props, "abierto" | "foto"> & { foto: FotoAbierta }) {
  const [posicion, setPosicion] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(ZOOM_MINIMO);
  const [opcion, setOpcion] = useState(0);
  const [area, setArea] = useState<Area | null>(null);

  const proporcion = useMemo(() => {
    if (forma.tipo === "circulo") return 1;
    if (forma.tipo === "fija") return forma.proporcion;

    const elegida = forma.opciones[opcion]?.valor ?? "como-vino";
    return elegida === "como-vino" ? foto.ancho / foto.alto : elegida;
  }, [forma, opcion, foto]);

  const alTerminarDeMover = useCallback((_relativa: Area, enPixeles: Area) => {
    setArea(enPixeles);
  }, []);

  const confirmar = () => {
    if (!area || ocupado) return;

    alConfirmar({
      x: Math.round(area.x),
      y: Math.round(area.y),
      width: Math.round(area.width),
      height: Math.round(area.height),
    });
  };

  return (
    <Emergente
      abierto
      alCerrar={alCancelar}
      titulo="Recortar la foto"
      descripcion={
        forma.tipo === "circulo"
          ? "Movela y acercala. Lo que queda adentro del círculo es lo que se ve."
          : "Movela y acercala. Lo que queda adentro del marco es lo que se sube."
      }
      ancho="amplio"
      acciones={
        <>
          <BotonDeEmergente onClick={alCancelar} disabled={ocupado}>
            Cancelar
          </BotonDeEmergente>
          <BotonDeEmergente
            variante="principal"
            onClick={confirmar}
            disabled={ocupado || !area}
          >
            {ocupado ? "Preparando…" : "Listo"}
          </BotonDeEmergente>
        </>
      }
    >
      <div className="-mx-4 -my-4 flex flex-col">
        {/* Fondo negro a propósito: acá manda la foto, no el color del modo. */}
        <div className="relative h-[52dvh] min-h-64 w-full bg-black">
          <Cropper
            image={foto.url}
            crop={posicion}
            zoom={zoom}
            minZoom={ZOOM_MINIMO}
            maxZoom={ZOOM_MAXIMO}
            aspect={proporcion}
            cropShape={forma.tipo === "circulo" ? "round" : "rect"}
            showGrid={forma.tipo !== "circulo"}
            objectFit="contain"
            onCropChange={setPosicion}
            onZoomChange={setZoom}
            onCropComplete={alTerminarDeMover}
            classes={{ containerClassName: "bg-black" }}
          />

          {/*
            El zoom de dos dedos es un gesto fino: con guantes no se acierta.
            Por eso están estos, y son grandes.
          */}
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-3">
            <BotonDeZoom
              etiqueta="Alejar la foto"
              deshabilitado={ocupado || zoom <= ZOOM_MINIMO}
              alTocar={() => setZoom((z) => Math.max(ZOOM_MINIMO, z - PASO_DE_ZOOM))}
            >
              <path d="M5 12h14" />
            </BotonDeZoom>
            <BotonDeZoom
              etiqueta="Acercar la foto"
              deshabilitado={ocupado || zoom >= ZOOM_MAXIMO}
              alTocar={() => setZoom((z) => Math.min(ZOOM_MAXIMO, z + PASO_DE_ZOOM))}
            >
              <path d="M12 5v14M5 12h14" />
            </BotonDeZoom>
          </div>
        </div>

        {forma.tipo === "elegir" ? (
          <div className="flex flex-wrap justify-center gap-2 px-4 py-3">
            {forma.opciones.map((cada, indice) => (
              <button
                key={cada.etiqueta}
                type="button"
                aria-pressed={indice === opcion}
                disabled={ocupado}
                onPointerDown={() => vibrarAlTocar()}
                onClick={() => setOpcion(indice)}
                className={[
                  CLASE_DE_RESPUESTA_AL_TOQUE,
                  "min-h-14 rounded-xl border px-5 text-sm font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde",
                  "disabled:opacity-50",
                  indice === opcion
                    ? "border-acento-borde bg-acento text-acento-texto"
                    : "border-borde-fuerte bg-fondo text-texto",
                ].join(" ")}
              >
                {cada.etiqueta}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </Emergente>
  );
}

function BotonDeZoom({
  etiqueta,
  deshabilitado,
  alTocar,
  children,
}: {
  etiqueta: string;
  deshabilitado: boolean;
  alTocar: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={etiqueta}
      disabled={deshabilitado}
      onPointerDown={() => vibrarAlTocar()}
      onClick={alTocar}
      className={[
        CLASE_DE_RESPUESTA_AL_TOQUE,
        "pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full",
        "border border-white/25 bg-black/65 text-white backdrop-blur",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
        "disabled:opacity-40",
      ].join(" ")}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        aria-hidden
      >
        {children}
      </svg>
    </button>
  );
}
