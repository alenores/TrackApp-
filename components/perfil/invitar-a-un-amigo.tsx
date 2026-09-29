"use client";

import { useMemo, useState } from "react";
import QRCode from "qrcode";
import { vibrarAlTocar } from "@/lib/vibracion";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";
import { BotonDeEmergente, Emergente } from "@/components/ui/emergente";
import { linkDeWhatsApp } from "@/lib/perfiles/invitacion";

/** El margen blanco que el QR necesita alrededor para que la cámara lo lea. */
const MARGEN_DEL_QR = 4;

function CodigoQR({ link }: { link: string }) {
  const dibujo = useMemo(() => {
    try {
      const { modules } = QRCode.create(link, { errorCorrectionLevel: "M" });
      const lado = modules.size;
      let trazo = "";
      for (let fila = 0; fila < lado; fila++) {
        for (let columna = 0; columna < lado; columna++) {
          if (modules.get(fila, columna)) {
            trazo += `M${columna + MARGEN_DEL_QR} ${fila + MARGEN_DEL_QR}h1v1h-1z`;
          }
        }
      }
      return { lado: lado + MARGEN_DEL_QR * 2, trazo };
    } catch {
      return null;
    }
  }, [link]);

  if (!dibujo) {
    return (
      <p role="alert" className="text-sm leading-6 text-rojo-texto">
        No se pudo armar el código QR. Cerrá este cartel y volvé a tocar «Ver
        código QR». Si sigue igual, usá el botón de WhatsApp.
      </p>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${dibujo.lado} ${dibujo.lado}`}
      role="img"
      aria-label="Código QR para abrir TrackApp"
      shapeRendering="crispEdges"
      className="mx-auto block w-full max-w-72 rounded-lg bg-qr-fondo text-qr-modulo"
    >
      <path d={dibujo.trazo} fill="currentColor" />
    </svg>
  );
}

export function InvitarAUnAmigo() {
  const [qrAbierto, setQrAbierto] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  // La dirección se lee al tocar, no al dibujar: así la pantalla no depende de
  // nada del navegador para armarse.
  const direccion = () => window.location.origin;

  const compartirPorWhatsApp = () => {
    window.open(linkDeWhatsApp(direccion()), "_blank", "noopener,noreferrer");
  };

  const verQR = () => {
    setLink(direccion());
    setQrAbierto(true);
  };

  const clase =
    "flex h-10 w-10 items-center justify-center rounded-full text-texto-suave hover:bg-superficie-alta hover:text-texto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde";

  return (
    <>
      <div className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={compartirPorWhatsApp}
          onPointerDown={() => vibrarAlTocar()}
          aria-label="Compartir TrackApp por WhatsApp"
          title="Compartir por WhatsApp"
          className={[CLASE_DE_RESPUESTA_AL_TOQUE, clase].join(" ")}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden
          >
            <circle cx="18" cy="5" r="2.5" />
            <circle cx="6" cy="12" r="2.5" />
            <circle cx="18" cy="19" r="2.5" />
            <path d="m8.3 10.8 7.4-4.6M8.3 13.2l7.4 4.6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={verQR}
          onPointerDown={() => vibrarAlTocar()}
          aria-label="Ver código QR de TrackApp"
          title="Ver código QR"
          className={[CLASE_DE_RESPUESTA_AL_TOQUE, clase].join(" ")}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinejoin="round"
            aria-hidden
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M14 14h3v3h-3zM20 14v1M14 20h1M18 20h3v-2" />
          </svg>
        </button>
      </div>

      <Emergente
        abierto={qrAbierto}
        alCerrar={() => setQrAbierto(false)}
        titulo="Código QR de TrackApp"
        descripcion="Tu amigo lo escanea con la cámara del celular y se le abre la app."
        acciones={
          <BotonDeEmergente onClick={() => setQrAbierto(false)}>
            Cerrar
          </BotonDeEmergente>
        }
      >
        {link ? <CodigoQR link={link} /> : null}
      </Emergente>
    </>
  );
}
