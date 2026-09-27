"use client";

import { useEffect, useState } from "react";
import {
  EVENTO_CONEXION,
  hayConexion,
  iniciarVigilanciaDeConexion,
} from "@/lib/conexion";

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
 * **Señal es señal que sirve** (`lib/conexion.ts`): con una rayita que no deja
 * pasar nada —el gris del cerro— da `false`, igual que con modo avión.
 *
 * **Mientras no se sabe, se responde que no hay.** Un botón que aparece tarde
 * no molesta a nadie; uno que aparece y al tocarlo falla, sí.
 */
export function useHaySenal(): boolean {
  const [haySenal, setHaySenal] = useState(false);

  useEffect(() => {
    const mirar = () => setHaySenal(hayConexion());
    iniciarVigilanciaDeConexion();
    mirar();

    window.addEventListener("online", mirar);
    window.addEventListener("offline", mirar);
    window.addEventListener(EVENTO_CONEXION, mirar);

    return () => {
      window.removeEventListener("online", mirar);
      window.removeEventListener("offline", mirar);
      window.removeEventListener(EVENTO_CONEXION, mirar);
    };
  }, []);

  return haySenal;
}
