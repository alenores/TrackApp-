"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { ponerAlDiaUnaVezPorApertura } from "@/lib/offline/puesta-al-dia";
import { dejarListasLasPantallas } from "@/lib/offline/pantallas-listas-al-abrir";

/**
 * Deja listas en memoria, al abrir, las pantallas de todos los días (ver
 * `lib/offline/pantallas-listas-al-abrir.ts`). Espera a que los datos se pongan
 * al día para no pelearles la señal. Se pide la pantalla entera, no solo su
 * esqueleto: si no, entrar igual saldría a internet.
 */
export function usePantallasListasAlAbrir(): void {
  const router = useRouter();
  const pathname = usePathname();
  const haySenal = useHaySenal();

  useEffect(() => {
    if (!haySenal) return;
    let vigente = true;
    void ponerAlDiaUnaVezPorApertura().finally(() => {
      if (!vigente) return;
      dejarListasLasPantallas(
        (direccion) => router.prefetch(direccion, { kind: PrefetchKind.FULL }),
        window.location.pathname,
      );
    });
    return () => {
      vigente = false;
    };
    // `pathname`: si se abrió en la navegación, se hace al salir de ella.
  }, [haySenal, pathname, router]);
}
