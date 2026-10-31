"use client";

import { Boton } from "@/components/ui/boton";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { useSombraGruesa } from "@/hooks/use-sombra-gruesa";
import type { Sector } from "@/types/database";

/**
 * Avisa que el sombreado del terreno quedó con menos detalle, y deja
 * reintentarlo (decisión 079; Ale, 2026-10-31).
 *
 * Pasa cuando el servicio de alturas de Córdoba no contestó al bajar: el
 * sector bajó igual, con el sombreado de 30 m, y el mapa anda. Esto se dice en
 * casa, con el motivo real, para que el usuario elija si reintenta antes de
 * salir. Sin señal se sigue diciendo; lo que no está es el botón.
 *
 * No dice nada si no hay nada que avisar.
 */
export function AvisoDeSombraGruesa({ sectores }: { sectores: Sector[] }) {
  const { pedazos, motivo, paso, reintentar } = useSombraGruesa(sectores);
  const haySenal = useHaySenal();
  const resultado = paso.paso === "termino" ? paso.resultado : null;

  if (resultado?.estado === "listo" && resultado.siguen === 0 && pedazos === 0) {
    return (
      <p role="status" className="rounded-xl bg-verde-fondo px-3 py-2 text-sm leading-6 text-verde-texto">
        Listo: el sombreado del terreno quedó con todo el detalle.
      </p>
    );
  }

  if (pedazos === 0) return null;

  const reintentando = paso.paso === "reintentando";
  const deCuantos = pedazos === 1 ? "1 pedazo" : `${pedazos} pedazos`;

  return (
    <div
      role="alert"
      className="space-y-2 rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-2 text-sm leading-6 text-ambar-texto"
    >
      <p>
        El sombreado del terreno quedó con menos detalle en {deCuantos}: {motivo}. El mapa anda
        igual. {haySenal ? "Podés reintentarlo ahora." : "Reintentalo cuando tengas señal."}
      </p>

      {resultado?.estado === "fallo" ? (
        <p>No se pudo reintentar: {resultado.motivo}</p>
      ) : null}
      {resultado?.estado === "listo" && resultado.siguen > 0 ? (
        <p>
          {resultado.mejorados > 0
            ? `Se completaron ${resultado.mejorados}, pero faltan ${resultado.siguen}.`
            : "Sigue igual."}{" "}
          Probá de nuevo más tarde.
        </p>
      ) : null}

      {haySenal ? (
        <div className="flex justify-end">
          <Boton variante="secundario" disabled={reintentando} onClick={() => void reintentar()}>
            {reintentando ? "Reintentando…" : "Reintentar sombreado"}
          </Boton>
        </div>
      ) : null}
    </div>
  );
}
