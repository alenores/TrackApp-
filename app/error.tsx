"use client";

import { useEffect, useState } from "react";
import {
  convieneRecargarPorVersionNueva,
  direccionDelArchivoQueFalta,
  esUnArchivoDeLaAppQueYaNoExiste,
  preguntarPorElArchivo,
  type RespuestaSobreElArchivo,
} from "@/lib/actualizacion/version-nueva";
import {
  tirarTodasLasPantallasGuardadas,
  versionDeLasPantallasGuardadas,
} from "@/lib/offline/pantallas-de-otra-version";
import { SELLO_DE_VERSION } from "@/lib/sello-de-version";
import { DatosDeLaFalla, juntarLosDatos } from "@/app/datos-de-la-falla";

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
 *
 * **Una excepción que no es una rotura:** cuando lo que falló es un archivo de
 * la app que ya no existe, es que la app se actualizó mientras estaba abierta.
 * Ahí no hay nada roto: se recarga una vez, sola, y listo. Ver
 * `lib/actualizacion/version-nueva.ts`.
 *
 * **Antes de recargar se le pregunta a internet por la pieza que faltó.** Si
 * contesta que no existe, hay señal y salió una versión nueva: se tiran las
 * pantallas guardadas —que son de la versión vieja y volverían a pedir la
 * pieza— y se recarga. Si no contesta, puede ser el cerro sin señal: ahí las
 * pantallas guardadas son lo único que deja navegar y no se tocan.
 *
 * **Y el cartel muestra todos los datos de la falla** (pedido de Ale): para
 * arreglarla con una captura, no a las adivinanzas.
 */

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

type Fase = "revisando" | "recargando" | "cartel";

const QUE_CONTESTO: Record<RespuestaSobreElArchivo, string> = {
  no_existe: "no existe: hay señal y salió una versión nueva de la app",
  existe: "existe: fue un corte pasajero",
  sin_respuesta: "no contestó: sin señal o muy lenta",
};

export default function PantallaRota({ error, reset }: Props) {
  const esVersionNueva = esUnArchivoDeLaAppQueYaNoExiste(error);
  const piezaQueFalta = esVersionNueva ? direccionDelArchivoQueFalta(error) : null;

  const [consulta, setConsulta] = useState<RespuestaSobreElArchivo | null>(null);
  // Se decide al aparecer. Sin la dirección de la pieza no hay a quién
  // preguntarle: se hace lo de siempre, recargar una vez.
  const [fase, setFase] = useState<Fase>(() => {
    if (!esVersionNueva) return "cartel";
    if (piezaQueFalta) return "revisando";
    return convieneRecargarPorVersionNueva(
      typeof window === "undefined" ? null : window.sessionStorage,
    )
      ? "recargando"
      : "cartel";
  });

  useEffect(() => {
    if (fase === "recargando") {
      window.location.reload();
      return;
    }
    if (fase === "cartel") {
      console.error("Se rompió una pantalla de TrackApp:", error);
      return;
    }

    // Revisando: se pregunta por la pieza, con tope de tiempo.
    let vigente = true;
    void preguntarPorElArchivo(piezaQueFalta ?? "").then(async (respuesta) => {
      if (!vigente) return;
      setConsulta(respuesta);

      const puedeRecargar =
        respuesta !== "sin_respuesta" &&
        convieneRecargarPorVersionNueva(window.sessionStorage);

      if (!puedeRecargar) {
        setFase("cartel");
        return;
      }
      // Con la pieza confirmada como inexistente, lo guardado es de la
      // versión vieja: se tira para que la recarga traiga la nueva.
      if (respuesta === "no_existe") await tirarTodasLasPantallasGuardadas();
      if (vigente) setFase("recargando");
    });

    return () => {
      vigente = false;
    };
  }, [fase, error, piezaQueFalta]);

  if (fase !== "cartel") {
    return (
      <div
        role="status"
        style={{
          minHeight: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "var(--fondo, #0f172a)",
          color: "var(--texto-suave, #aab8c9)",
          fontFamily: "system-ui, sans-serif",
          fontSize: "16px",
        }}
      >
        {fase === "revisando"
          ? "Revisando qué pasó…"
          : "Hay una versión nueva de la app. Un segundo…"}
      </div>
    );
  }

  /* Si es una versión nueva, reintentar por dentro no sirve: hay que recargar
     la página entera. Si internet ya confirmó que la pieza no existe, antes se
     tiran las pantallas guardadas, que son de la versión vieja. */
  const probarDeNuevo = esVersionNueva
    ? async () => {
        if (consulta === "no_existe") await tirarTodasLasPantallasGuardadas();
        window.location.reload();
      }
    : reset;

  const explicacion =
    esVersionNueva && consulta === "sin_respuesta"
      ? "Falta una pieza de la app que no está guardada en el celular, y no hay señal para traerla. Volvé a la pantalla anterior, o abrí la app de nuevo cuando tengas señal."
      : esVersionNueva && consulta === "no_existe"
        ? "Salió una versión nueva de la app y esta pantalla no pudo cargarla sola. Tocá «Probar de nuevo»; si sigue, tocá «Ir a mis rutas»."
        : "No es tu celular ni tu conexión: falló la app. Lo que tenés descargado sigue guardado y no se perdió nada.";

  const datos = juntarLosDatos({
    error,
    version: SELLO_DE_VERSION,
    versionDeLasPantallas:
      typeof window === "undefined" ? null : versionDeLasPantallasGuardadas(),
    piezaQueFalta,
    consulta: consulta ? QUE_CONTESTO[consulta] : null,
  });

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
        {explicacion}
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
        onClick={() => void probarDeNuevo()}
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

      <DatosDeLaFalla datos={datos} />
    </div>
  );
}
