"use client";

import { useRouter } from "next/navigation";
import { Boton } from "@/components/ui/boton";
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
 *
 * Cargar una salida es el botón «+» flotante, que pone el armazón.
 */

type Props = {
  miPerfilId: string | null;
  resultado: PaginaDeSalidas;
};

export function PantallaDeSalidas({ miPerfilId, resultado }: Props) {
  const router = useRouter();
  const haySenal = useHaySenal();

  return (
    <div className="space-y-4 pb-16">
      <h1 className="text-2xl font-bold uppercase text-texto">Salidas</h1>

      {!haySenal ? (
        <Tarjeta franja="ambar">
          <p className="text-base leading-6 text-texto">
            Sin señal. Salidas funciona solo con internet: lo que ves se cargó antes de
            perderla. Para cargar o editar una salida, esperá a tener señal.
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
              : "Todavía nadie cargó una salida. Cargá la primera con el botón «+» de abajo a la derecha."}
          </p>
        </Tarjeta>
      ) : (
        <ul className="space-y-4">
          {resultado.salidas.map((salida) => (
            <li key={salida.id}>
              <TarjetaDeSalida
                salida={salida}
                puedeEditar={haySenal && salida.perfil.id === miPerfilId}
              />
            </li>
          ))}
        </ul>
      )}

      {resultado.ok && (resultado.pagina > 1 || resultado.hayMas) ? (
        <div className="flex justify-between gap-3">
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
