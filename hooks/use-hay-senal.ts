"use client";

import { useEffect, useState } from "react";

/**
 * ¿Hay señal ahora mismo?
 *
 * **Se entera al instante.** El navegador avisa cuando la conexión aparece o
 * se va —poner el celular en modo avión dispara el aviso—, así que la pantalla
 * se acomoda sola sin que el usuario tenga que recargar nada.
 *
 * Preguntar una sola vez al abrir no alcanza: alguien que abre la app en el
 * pueblo y sube al cerro seguiría viendo botones que ya no funcionan.
 *
 * **Mientras no se sabe, se responde que no hay.** Un botón que aparece tarde
 * no molesta a nadie; uno que aparece y al tocarlo falla, sí.
 */
export function useHaySenal(): boolean {
  const [haySenal, setHaySenal] = useState(false);

  useEffect(() => {
    const mirar = () => setHaySenal(navigator.onLine);
    mirar();

    window.addEventListener("online", mirar);
    window.addEventListener("offline", mirar);

    return () => {
      window.removeEventListener("online", mirar);
      window.removeEventListener("offline", mirar);
    };
  }, []);

  return haySenal;
}
