"use client";

import { useEffect } from "react";

/**
 * **La red de rescate.** Lo que se ve cuando una pantalla falla al dibujarse.
 *
 * Sin esto la pantalla queda completamente vacía y el usuario no tiene ni un
 * cartel que leer. En el cerro eso es peligroso: la persona cree que la app
 * está pensando y en realidad se rompió.
 *
 * **No usa ninguna pieza de la app, a propósito.** Ni la tarjeta, ni el botón,
 * ni los diálogos. El aviso de error no puede depender de lo mismo que falló:
 * si se rompió el botón, un aviso hecho con ese botón tampoco se dibuja.
 * Por eso acá van estilos escritos a mano — es el único lugar de la app donde
 * eso es correcto, y por eso toma los colores de las variables igual.
 */

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function PantallaRota({ error, reset }: Props) {
  useEffect(() => {
    console.error("Se rompió una pantalla de TrackApp:", error);
  }, [error]);

  return (
    <div
      role="alert"
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: "16px",
        padding: "24px",
        background: "var(--fondo, #0f172a)",
        color: "var(--texto, #f1f5f9)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 600 }}>
        Esta pantalla se rompió
      </h1>

      <p style={{ margin: 0, fontSize: "16px", lineHeight: "24px" }}>
        No es tu celular ni tu conexión: falló la app. Lo que tenés descargado
        sigue guardado y no se perdió nada.
      </p>

      <p
        style={{
          margin: 0,
          padding: "12px",
          borderRadius: "10px",
          background: "var(--superficie, #1e293b)",
          border: "1px solid var(--borde, #334155)",
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
          border: "1px solid var(--acento-borde, #047857)",
          background: "var(--acento, #1b4332)",
          color: "var(--acento-texto, #d8f3dc)",
          fontSize: "18px",
          fontWeight: 600,
          fontFamily: "inherit",
          cursor: "pointer",
        }}
      >
        Probar de nuevo
      </button>

      {/*
        Recarga la página entera a propósito, en vez de navegar por dentro de la
        app: si lo que se rompió es la navegación, navegar por dentro tampoco
        va a funcionar.
      */}
      <button
        type="button"
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a propósito: la red de rescate no puede usar la navegación interna, que es justo lo que puede estar roto.
        onClick={() => window.location.assign("/rutas")}
        style={{
          minHeight: "56px",
          borderRadius: "12px",
          border: "1px solid var(--borde-fuerte, #8795ab)",
          background: "var(--superficie-alta, #334155)",
          color: "var(--texto, #f1f5f9)",
          fontSize: "16px",
          fontWeight: 600,
          fontFamily: "inherit",
          cursor: "pointer",
        }}
      >
        Ir a mis rutas
      </button>
    </div>
  );
}
