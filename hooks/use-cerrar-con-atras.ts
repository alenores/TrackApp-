"use client";

import { useEffect, useRef } from "react";
import {
  abrirEnElHistorial,
  anotarCierreConAtras,
  cerrarEnElHistorial,
  cerrarSoloLaDeAdelante,
  seguirDeLargoSiSobra,
  soltarEmergente,
} from "@/lib/emergentes/historial";
import { anotarCierreConEscape } from "@/lib/emergentes/tecla-escape";

/**
 * Hace que el botón físico de atrás cierre una pantalla emergente en vez de
 * salir de la app.
 *
 * Sin esto, el atrás del celular cierra la app entera estando adentro de un
 * cartel de confirmación, que es exactamente lo contrario de lo que espera
 * cualquiera.
 *
 * Lo usa `Emergente` por su cuenta. **No hace falta llamarlo aparte.**
 *
 * El atrás y Escape cierran solo lo que está adelante. Si hay otra ventana
 * detrás, se queda.
 *
 * El estado del historial va **sin dirección**: si cambiara la dirección,
 * abrir un cartel dispararía un pedido a internet, y sin señal eso termina en
 * pantalla en blanco.
 *
 * Las cuentas del historial no están acá sino en `lib/emergentes/historial.ts`,
 * que es donde se explica por qué cerrar con un botón **no** vuelve atrás.
 */

let escuchando = false;

function noHacerApretarDosVeces(): void {
  if (escuchando || typeof window === "undefined") return;
  escuchando = true;
  window.addEventListener("popstate", () => {
    if (seguirDeLargoSiSobra()) return;
    cerrarSoloLaDeAdelante();
  });
}

export function useCerrarConAtras(abierto: boolean, cerrar: () => void): void {
  const cerrarRef = useRef(cerrar);
  useEffect(() => {
    cerrarRef.current = cerrar;
  }, [cerrar]);

  // Escape va en la lista compartida y se anota una sola vez por apertura.
  // Si se volviera a anotar en cada dibujado, un cartel de atrás saltaría
  // encima del que está adelante.
  useEffect(() => {
    if (!abierto) return;
    return anotarCierreConEscape(() => cerrarRef.current());
  }, [abierto]);

  // El atrás también se anota una sola vez. Si se reanotara en cada dibujado,
  // una ventana de atrás pasaría adelante.
  useEffect(() => {
    if (!abierto) return;
    return anotarCierreConAtras(() => cerrarRef.current());
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;

    noHacerApretarDosVeces();
    const id = abrirEnElHistorial();

    return () => {
      cerrarEnElHistorial(id);
      soltarEmergente();
    };
    // `cerrar` entra a propósito: si el usuario se arrepiente de salir, hay
    // que reponer la entrada que el atrás ya consumió.
  }, [abierto, cerrar]);
}
