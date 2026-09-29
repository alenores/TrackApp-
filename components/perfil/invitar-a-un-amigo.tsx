"use client";

import { useMemo, useState } from "react";
import QRCode from "qrcode";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Boton } from "@/components/ui/boton";
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

  return (
    <>
      <Tarjeta>
        <h2 className="text-base font-bold text-texto">Invitá a un amigo</h2>
        <p className="mt-1 text-sm leading-6 text-texto-suave">
          Pasale la app por WhatsApp o mostrale el código QR para que lo
          escanee.
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <Boton
            variante="principal"
            anchoCompleto
            className="min-h-14"
            onClick={compartirPorWhatsApp}
          >
            Compartir por WhatsApp
          </Boton>
          <Boton
            variante="secundario"
            anchoCompleto
            className="min-h-14"
            onClick={verQR}
          >
            Ver código QR
          </Boton>
        </div>
      </Tarjeta>

      <Emergente
        abierto={qrAbierto}
        alCerrar={() => setQrAbierto(false)}
        titulo="Código QR de TrackApp"
        descripcion="Tu amigo lo escanea con la cámara del celular y se le abre la app."
        acciones={
          <BotonDeEmergente
            className="min-h-14"
            onClick={() => setQrAbierto(false)}
          >
            Cerrar
          </BotonDeEmergente>
        }
      >
        {link ? <CodigoQR link={link} /> : null}
      </Emergente>
    </>
  );
}
