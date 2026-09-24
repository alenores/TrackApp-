"use client";

import { useEffect } from "react";
import { DatosDeLaFalla, juntarLosDatos } from "@/app/datos-de-la-falla";
import { versionDeLasPantallasGuardadas } from "@/lib/offline/pantallas-de-otra-version";
import { SELLO_DE_VERSION } from "@/lib/sello-de-version";

/**
 * La red de rescate de más afuera: cuando falla el armazón de la app entera y
 * ni siquiera queda en pie la otra red.
 *
 * Tiene que dibujar su propio documento, así que no puede usar nada de la app
 * ni las variables de color: acá los colores van escritos, porque es lo único
 * que se puede garantizar cuando ya falló todo lo demás.
 *
 * Muestra también todos los datos de la falla, para arreglarla con una captura.
 */

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function TodoRoto({ error, reset }: Props) {
  useEffect(() => {
    console.error("Se rompió TrackApp entera:", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "16px",
          padding: "24px",
          background: "#0f172a",
          color: "#f1f5f9",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 600 }}>
          TrackApp se rompió
        </h1>

        <p style={{ margin: 0, fontSize: "16px", lineHeight: "24px" }}>
          Cerrá la app y volvé a abrirla. Lo que tenés descargado sigue guardado
          en el celular y no se perdió nada.
        </p>

        <p
          style={{
            margin: 0,
            padding: "12px",
            borderRadius: "10px",
            background: "#1e293b",
            border: "1px solid #334155",
            fontSize: "14px",
            lineHeight: "22px",
            overflowWrap: "anywhere",
          }}
        >
          {error.message || "La app no dejó dicho qué falló."}
        </p>

        <button
          type="button"
          onClick={reset}
          style={{
            minHeight: "64px",
            borderRadius: "12px",
            border: "1px solid #047857",
            background: "#1b4332",
            color: "#d8f3dc",
            fontSize: "18px",
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          Probar de nuevo
        </button>

        <DatosDeLaFalla
          datos={juntarLosDatos({
            error,
            version: SELLO_DE_VERSION,
            versionDeLasPantallas: versionDeLasPantallasGuardadas(),
          })}
        />
      </body>
    </html>
  );
}
