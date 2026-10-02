"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { borrarSalida } from "@/app/actions/salidas";
import { Boton } from "@/components/ui/boton";
import { useDialogos } from "@/components/ui/dialogos";
import { Enlace } from "@/components/ui/enlace";
import { Tarjeta } from "@/components/ui/tarjeta";
import { TarjetaDeSalida } from "@/components/salidas/tarjeta-de-salida";
import { useHaySenal } from "@/hooks/use-hay-senal";
import type { PaginaDeSalidas } from "@/lib/salidas/datos";

/**
 * La lista de salidas.
 *
 * **Salidas es 100 % con internet.** La lista llega armada del servidor; acá
 * solo se dibuja. Si la señal se va con la pantalla abierta, lo que ya se ve
 * queda a la vista y desaparecen las acciones que necesitan internet.
 */

type Props = {
  miPerfilId: string | null;
  resultado: PaginaDeSalidas;
};

export function PantallaDeSalidas({ miPerfilId, resultado }: Props) {
  const router = useRouter();
  const haySenal = useHaySenal();
  const { confirmar, avisar } = useDialogos();
  const [borrando, setBorrando] = useState<number | null>(null);

  const alBorrar = async (salidaId: number, titulo: string) => {
    const seguro = await confirmar({
      titulo: "¿Borrar esta salida?",
      mensaje: `«${titulo}» deja de verse en la lista, para vos y para los demás.`,
      textoDeAceptar: "Borrar la salida",
      destructivo: true,
    });
    if (!seguro) return;

    setBorrando(salidaId);
    const respuesta = await borrarSalida(salidaId);
    setBorrando(null);

    if (!respuesta.ok) {
      await avisar({ titulo: "No se borró la salida", mensaje: respuesta.error });
      return;
    }
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold uppercase text-texto">Salidas</h1>
        {haySenal ? (
          <Enlace href="/salidas/nueva" variante="principal">
            Cargar una salida
          </Enlace>
        ) : null}
      </div>

      {!haySenal ? (
        <Tarjeta franja="ambar">
          <p className="text-base leading-6 text-texto">
            Sin señal. Salidas funciona solo con internet: lo que ves se cargó antes de
            perderla. Para cargar o borrar una salida, esperá a tener señal.
          </p>
        </Tarjeta>
      ) : null}

      {!resultado.ok ? (
        <Tarjeta franja="rojo" className="space-y-3">
          <p role="alert" className="text-base leading-6 text-texto">
            No se pudo traer la lista de salidas: {resultado.motivo}
          </p>
          <Boton variante="secundario" onClick={() => router.refresh()}>
            Volver a intentar
          </Boton>
        </Tarjeta>
      ) : resultado.salidas.length === 0 ? (
        <Tarjeta>
          <p className="text-base leading-6 text-texto-suave">
            {resultado.pagina > 1
              ? "No hay salidas más antiguas."
              : "Todavía nadie cargó una salida. Cuando alguien cargue la suya, aparece acá."}
          </p>
        </Tarjeta>
      ) : (
        <ul className="space-y-4">
          {resultado.salidas.map((salida) => (
            <li key={salida.id}>
              <TarjetaDeSalida
                salida={salida}
                puedeBorrar={haySenal && salida.perfil.id === miPerfilId}
                borrando={borrando === salida.id}
                alBorrar={() => void alBorrar(salida.id, salida.titulo)}
              />
            </li>
          ))}
        </ul>
      )}

      {resultado.ok && (resultado.pagina > 1 || resultado.hayMas) ? (
        <div className="flex justify-between gap-3 pb-2">
          {resultado.pagina > 1 ? (
            <Enlace
              href={resultado.pagina === 2 ? "/salidas" : `/salidas?pagina=${resultado.pagina - 1}`}
              variante="secundario"
            >
              Más recientes
            </Enlace>
          ) : (
            <span />
          )}
          {resultado.hayMas ? (
            <Enlace href={`/salidas?pagina=${resultado.pagina + 1}`} variante="secundario">
              Más antiguas
            </Enlace>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
