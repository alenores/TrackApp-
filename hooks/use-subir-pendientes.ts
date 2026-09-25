"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { usePendientes } from "@/hooks/use-pendientes";
import { guardarFotos } from "@/lib/anotaciones/deposito";
import {
  guardarPendiente,
  releerLosPendientes,
  sacarPendiente,
} from "@/lib/anotaciones/pendientes";
import { subirLosPendientes } from "@/lib/anotaciones/subir-pendientes";
import { esLaPantallaDeNavegar } from "@/lib/actualizacion/version-nueva";
import { ponerAlDiaDespuesDeGuardar } from "@/lib/offline/puesta-al-dia";
import { crearClienteEnElNavegador } from "@/lib/supabase/navegador";

/**
 * Sube sola lo que se marcó sin señal, apenas se puede.
 *
 * Va en el armazón de la app, así corre en cualquier pantalla. Tres
 * condiciones: **hay señal, hay algo esperando y la navegación está
 * cerrada.** Navegando no se sale a internet, ni con señal: lo marcado espera
 * a que salgas del mapa.
 *
 * Cuando sube algo, pone el paquete al día para que se vea como quedó en la
 * base, y recién ahí se olvida de los pendientes terminados.
 */

/** Para que otra pantalla —el aviso del inicio— pida reintentar ya. */
const pedidos = new Set<() => void>();

export function pedirQueSeSubaYa(): void {
  for (const pedir of pedidos) pedir();
}

export function useSubirPendientes(miPerfilId: string | null): void {
  const pendientes = usePendientes();
  const haySenal = useHaySenal();
  const camino = usePathname();
  const navegando = esLaPantallaDeNavegar(camino);
  const [intento, setIntento] = useState(0);
  const corriendoRef = useRef(false);

  const hayQueSubir = pendientes.some((cada) => !cada.terminada);
  const hayTerminados = pendientes.some((cada) => cada.terminada);

  useEffect(() => {
    if (!haySenal || navegando || !miPerfilId) return;
    if (!hayQueSubir && !hayTerminados) return;
    if (corriendoRef.current) return;

    corriendoRef.current = true;

    void (async () => {
      try {
        const lista = await releerLosPendientes();
        await subirLosPendientes({
          supabase: crearClienteEnElNavegador(),
          perfilId: miPerfilId,
          pendientes: lista,
          guardar: (pendiente) => guardarPendiente(pendiente),
          guardarFotoBajada: async (direccion, chica) => {
            await guardarFotos([
              { direccion, bytes: new Uint8Array(await chica.arrayBuffer()) },
            ]);
          },
        });
        // Lo que falló quedó anotado en cada pendiente, con su motivo: el
        // aviso del inicio lo muestra.

        // Lo terminado se olvida recién cuando el paquete ya lo muestra como
        // quedó: si se olvidara antes, una marca nueva desaparecería del mapa o
        // una borrada volvería a aparecer hasta la próxima puesta al día.
        const terminados = (await releerLosPendientes()).filter((cada) => cada.terminada);
        if (terminados.length > 0) {
          const puesta = await ponerAlDiaDespuesDeGuardar();
          const enElPaquete = new Set((puesta.paquete?.anotaciones ?? []).map((cada) => cada.id));
          const salioBien = puesta.clase === "actualizado" || puesta.clase === "al_dia";

          for (const cada of terminados) {
            const yaSeVe =
              cada.clase === "crear"
                ? cada.anotacionId !== null && enElPaquete.has(cada.anotacionId)
                : cada.clase === "borrar"
                  ? !enElPaquete.has(cada.anotacionId)
                  : salioBien;
            if (salioBien && yaSeVe) await sacarPendiente(cada.codigo);
          }
        }
      } catch {
        // Cada pendiente guardó su motivo. Se reintenta la próxima vez.
      } finally {
        corriendoRef.current = false;
      }
    })();
    // Se reintenta cuando vuelve la señal, al salir de la navegación, cuando
    // se marca algo nuevo o cuando el usuario lo pide.
  }, [haySenal, navegando, miPerfilId, hayQueSubir, hayTerminados, pendientes.length, intento]);

  const reintentar = useCallback(() => setIntento((cada) => cada + 1), []);

  useEffect(() => {
    pedidos.add(reintentar);
    return () => {
      pedidos.delete(reintentar);
    };
  }, [reintentar]);
}
