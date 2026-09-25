"use client";

import { useState } from "react";

/**
 * Los datos de una falla, a la vista, para poder arreglarla sin adivinar.
 *
 * **Pedido de Ale, 2026-09-24:** con el cartel solo, arreglar algo era ir a
 * las adivinanzas. Acá queda escrito todo lo que la app sabe de lo que pasó,
 * para que el usuario saque una captura —o toque «Copiar»— y se lo pase a
 * quien lo arregla.
 *
 * Es parte de la red de rescate, así que **no usa ninguna pieza de la app**:
 * si se rompió una pieza, esto no puede depender de ella. Estilos escritos acá
 * mismo, con las variables de color cuando existen.
 */

export type Dato = { etiqueta: string; valor: string };

export function DatosDeLaFalla({ datos }: { datos: Dato[] }) {
  const [copiado, setCopiado] = useState<"no" | "si" | "no_se_pudo">("no");
  const texto = datos.map((cada) => `${cada.etiqueta}: ${cada.valor}`).join("\n");

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado("si");
    } catch {
      setCopiado("no_se_pudo");
    }
  };

  return (
    <section
      aria-label="Datos para arreglarlo"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "12px",
        borderRadius: "10px",
        background: "var(--superficie, #1e293b)",
        border: "1px solid var(--borde, #334155)",
      }}
    >
      <p style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
        Datos para arreglarlo
      </p>
      <p style={{ margin: 0, fontSize: "14px", lineHeight: "20px", color: "var(--texto-suave, #aab8c9)" }}>
        Sacale una captura a esta pantalla o tocá «Copiar los datos» y pasáselos
        a Ale.
      </p>
      <dl style={{ margin: 0, display: "grid", gap: "6px" }}>
        {datos.map((cada) => (
          <div key={cada.etiqueta}>
            <dt style={{ fontSize: "13px", color: "var(--texto-suave, #aab8c9)" }}>{cada.etiqueta}</dt>
            <dd
              style={{
                margin: 0,
                fontSize: "13px",
                lineHeight: "19px",
                fontFamily: "ui-monospace, monospace",
                overflowWrap: "anywhere",
                whiteSpace: "pre-wrap",
              }}
            >
              {cada.valor}
            </dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        onClick={() => void copiar()}
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
        {copiado === "si"
          ? "Copiado"
          : copiado === "no_se_pudo"
            ? "No se pudo copiar: sacale una captura"
            : "Copiar los datos"}
      </button>
    </section>
  );
}

type Contexto = {
  error: Error & { digest?: string };
  version: string;
  versionDeLasPantallas: string | null;
  /** Qué contestó internet por la pieza que faltó, si se preguntó. */
  consulta?: string | null;
  piezaQueFalta?: string | null;
};

/** Todo lo que se sabe de la falla, en el orden en que sirve leerlo. */
export function juntarLosDatos({
  error,
  version,
  versionDeLasPantallas,
  consulta,
  piezaQueFalta,
}: Contexto): Dato[] {
  const hayVentana = typeof window !== "undefined";
  const datos: Dato[] = [
    { etiqueta: "Qué falló", valor: error.message || "La app no dejó dicho qué falló." },
    { etiqueta: "Tipo de falla", valor: error.name || "sin nombre" },
    { etiqueta: "Pantalla", valor: hayVentana ? window.location.pathname : "?" },
  ];
  if (piezaQueFalta) datos.push({ etiqueta: "Pieza que faltó", valor: piezaQueFalta });
  if (consulta) datos.push({ etiqueta: "Qué contestó internet por esa pieza", valor: consulta });
  datos.push(
    { etiqueta: "Versión de la app", valor: version },
    { etiqueta: "Versión de las pantallas guardadas", valor: versionDeLasPantallas ?? "ninguna anotada" },
    {
      etiqueta: "Señal según el navegador",
      valor: hayVentana ? (navigator.onLine ? "hay" : "no hay") : "?",
    },
    {
      etiqueta: "Motor sin señal",
      valor:
        hayVentana && "serviceWorker" in navigator
          ? navigator.serviceWorker.controller
            ? "al mando"
            : "no está al mando"
          : "no disponible",
    },
    { etiqueta: "Cuándo", valor: new Date().toLocaleString("es-AR") },
  );
  if (error.digest) datos.push({ etiqueta: "Código del servidor", valor: error.digest });
  if (error.stack) {
    datos.push({
      etiqueta: "Detalle técnico",
      valor: error.stack.split("\n").slice(0, 8).join("\n"),
    });
  }
  return datos;
}
