"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { useRegistros } from "@/hooks/use-registros";
import { esLaPantallaDeNavegar } from "@/lib/actualizacion/version-nueva";
import { leerPaquete } from "@/lib/offline/paquete";
import { anotarComoSubio, releerLosRegistros, sacarElRegistro } from "@/lib/salidas/registro";
import { subirUnRegistro } from "@/lib/salidas/subir-registros";
import { crearClienteEnElNavegador } from "@/lib/supabase/navegador";

/**
 * Sube solas las salidas registradas navegando, apenas se puede.
 *
 * Va en el armazón de la app, como la subida de anotaciones, y con las mismas
 * tres condiciones: **hay señal, hay algo terminado esperando y la navegación
 * está cerrada.** Navegando no se sale a internet, ni con señal.
 *
 * La que está en curso no se toca: todavía se está registrando.
 */
export function useSubirRegistros(miPerfilId: string | null): void {
  const registros = useRegistros();
  const haySenal = useHaySenal();
  const navegando = esLaPantallaDeNavegar(usePathname());
  const corriendoRef = useRef(false);

  const terminados = registros.filter((cada) => cada.terminadoEn !== null);
  const hayQueSubir = terminados.length > 0;

  useEffect(() => {
    if (!haySenal || navegando || !miPerfilId || !hayQueSubir) return;
    if (corriendoRef.current) return;
    corriendoRef.current = true;

    void (async () => {
      try {
        const paquete = leerPaquete();
        const lista = (await releerLosRegistros()).filter((cada) => cada.terminadoEn !== null);
        for (const registro of lista) {
          const problema = await subirUnRegistro(
            {
              supabase: crearClienteEnElNavegador(),
              perfilId: miPerfilId,
              actividadesDeLaRuta: (rutaId) =>
                paquete?.rutas.find((ruta) => ruta.id === rutaId)?.actividades ?? [],
              anotarElBorrador: (codigo, salidaId) => anotarComoSubio(codigo, { salidaId }),
            },
            registro,
          );
          if (problema) {
            // Queda guardado con su motivo, y se reintenta la próxima vez.
            await anotarComoSubio(registro.codigo, { ultimoError: problema });
          } else {
            await sacarElRegistro(registro.codigo);
          }
        }
      } catch {
        // Cada registro guardó su motivo. Se reintenta la próxima vez.
      } finally {
        corriendoRef.current = false;
      }
    })();
    // Se reintenta cuando vuelve la señal, al salir de la navegación o cuando
    // se termina una salida nueva.
  }, [haySenal, navegando, miPerfilId, hayQueSubir, terminados.length]);
}
