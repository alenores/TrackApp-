"use client";

import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as EventoDePunteroDeReact, type TouchEvent as EventoDeToqueDeReact } from "react";

/**
 * Bajar con el dedo un panel que sube desde abajo. **Los mismos gestos que
 * Vías de Escalada**, a pedido de Ale:
 *
 * - Desde la manija (el encabezado), arrastrar hacia abajo siempre baja.
 * - Desde la lista, solo si la lista ya está arriba del todo. Si todavía
 *   puede subir, el dedo mueve la lista y no el panel.
 * - Antes de decidir se espera un salto chico del dedo: un toque no es un
 *   arrastre.
 * - Soltado pasado el umbral, el panel se va; si no, vuelve a su lugar.
 *
 * Con el mouse, en la computadora, la manija se arrastra igual.
 *
 * Lo usan la emergente en forma de hoja y el panel de lista y mapa. Cada uno
 * decide qué es «irse»: cerrar la emergente o quedar en la barrita.
 */

/** Cuánto hay que bajar el panel para que se vaya al soltar. */
export const UMBRAL_PARA_IRSE = 90;
/** Antes de decidir si el dedo baja el panel o mueve la lista, se espera este salto. */
export const UMBRAL_DE_INTENCION = 8;
/** Lo que tarda en terminar de bajar antes de avisar que se fue. */
const TIEMPO_DE_SALIDA = 230;

function scrolleaVertical(nodo: HTMLElement): boolean {
  const desborde = window.getComputedStyle(nodo).overflowY;
  if (desborde !== "auto" && desborde !== "scroll") return false;
  return nodo.scrollHeight > nodo.clientHeight + 1;
}

/** Si alguna lista entre el dedo y el cuerpo todavía puede subir, el gesto es de la lista. */
export function hayListaQuePuedeSubir(desde: EventTarget | null, tope: HTMLElement): boolean {
  let nodo: HTMLElement | null =
    desde instanceof HTMLElement ? desde : desde instanceof Node ? desde.parentElement : null;
  while (nodo) {
    if (scrolleaVertical(nodo) && nodo.scrollTop > 1) return true;
    if (nodo === tope) break;
    nodo = nodo.parentElement;
  }
  return false;
}

type Opciones = {
  /** Sin esto no escucha nada: el panel está cerrado o en la computadora. */
  activo: boolean;
  /** Se llama cuando el dedo soltó el panel pasado el umbral. */
  alIrse: () => void;
  /**
   * `"deslizar"` termina de bajar el panel fuera de la pantalla y recién ahí
   * avisa (la emergente que se cierra). `"al-instante"` avisa enseguida y
   * vuelve el desplazamiento a cero (el panel que queda en su barrita).
   */
  salida?: "deslizar" | "al-instante";
};

export function useArrastreHaciaAbajo({ activo, alIrse, salida = "deslizar" }: Opciones) {
  const [desplazamiento, setDesplazamiento] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const desplazamientoRef = useRef(0);
  const inicioY = useRef<number | null>(null);
  const gesto = useRef<"nada" | "pendiente" | "bajar" | "lista">("nada");
  const cuerpoRef = useRef<HTMLDivElement | null>(null);
  // Si el último gesto movió el panel, el clic que llega al soltar no cuenta
  // como toque: si no, arrastrar un poco y soltar cerraría igual.
  const seMovio = useRef(false);
  const alIrseRef = useRef(alIrse);
  const salidaRef = useRef(salida);
  useLayoutEffect(() => {
    alIrseRef.current = alIrse;
    salidaRef.current = salida;
  }, [alIrse, salida]);

  const mover = (y: number, conDedo: boolean) => {
    if (conDedo && y > UMBRAL_DE_INTENCION) seMovio.current = true;
    desplazamientoRef.current = y;
    setDesplazamiento(y);
    setArrastrando(conDedo);
  };

  const soltar = () => {
    inicioY.current = null;
    gesto.current = "nada";
    const y = desplazamientoRef.current;
    setArrastrando(false);
    if (y <= UMBRAL_PARA_IRSE) {
      mover(0, false);
      return;
    }
    if (salidaRef.current === "al-instante") {
      mover(0, false);
      alIrseRef.current();
      return;
    }
    mover(window.innerHeight, false);
    window.setTimeout(() => {
      alIrseRef.current();
      mover(0, false);
    }, TIEMPO_DE_SALIDA);
  };

  // Al cerrarse, por donde sea, queda sin desplazamiento: la próxima
  // apertura arranca en su lugar.
  useEffect(() => {
    if (!activo) return;
    return () => {
      desplazamientoRef.current = 0;
      inicioY.current = null;
      gesto.current = "nada";
      setDesplazamiento(0);
      setArrastrando(false);
    };
  }, [activo]);

  /** Para la manija: desde ahí, bajar siempre baja el panel. */
  const manija = {
    onPointerDown: (evento: EventoDePunteroDeReact) => {
      // El dedo se maneja con los toques; acá solo el mouse.
      if (!activo || evento.pointerType !== "mouse" || evento.button !== 0) return;
      seMovio.current = false;
      inicioY.current = evento.clientY;
      gesto.current = "bajar";
      setArrastrando(true);
      const alMover = (movimiento: PointerEvent) => {
        if (inicioY.current === null) return;
        mover(Math.max(0, movimiento.clientY - inicioY.current), true);
      };
      const alSoltar = () => {
        window.removeEventListener("pointermove", alMover);
        window.removeEventListener("pointerup", alSoltar);
        window.removeEventListener("pointercancel", alSoltar);
        if (gesto.current === "bajar") soltar();
      };
      window.addEventListener("pointermove", alMover);
      window.addEventListener("pointerup", alSoltar);
      window.addEventListener("pointercancel", alSoltar);
    },
    onTouchStart: (evento: EventoDeToqueDeReact) => {
      if (!activo || evento.touches.length !== 1) return;
      seMovio.current = false;
      inicioY.current = evento.touches[0].clientY;
      gesto.current = "bajar";
      setArrastrando(true);
    },
    onTouchMove: (evento: EventoDeToqueDeReact) => {
      if (inicioY.current === null || gesto.current !== "bajar") return;
      mover(Math.max(0, evento.touches[0].clientY - inicioY.current), true);
    },
    onTouchEnd: () => {
      if (gesto.current === "bajar") soltar();
    },
    onTouchCancel: () => {
      if (gesto.current === "bajar") soltar();
    },
  };

  // En el cuerpo el oyente no puede ser pasivo: si la lista ya está arriba,
  // hay que frenar el scroll para que baje el panel y no la lista.
  useEffect(() => {
    if (!activo) return;
    const cuerpo = cuerpoRef.current;
    if (!cuerpo) return;

    const alEmpezar = (evento: TouchEvent) => {
      if (evento.touches.length !== 1) return;
      inicioY.current = evento.touches[0].clientY;
      gesto.current = "pendiente";
    };
    const alMover = (evento: TouchEvent) => {
      if (inicioY.current === null || evento.touches.length !== 1) return;
      const dy = evento.touches[0].clientY - inicioY.current;
      if (gesto.current === "pendiente") {
        if (Math.abs(dy) < UMBRAL_DE_INTENCION) return;
        if (dy > 0 && !hayListaQuePuedeSubir(evento.target, cuerpo)) {
          gesto.current = "bajar";
          setArrastrando(true);
        } else {
          gesto.current = "lista";
          return;
        }
      }
      if (gesto.current !== "bajar") return;
      if (evento.cancelable) evento.preventDefault();
      mover(Math.max(0, dy), true);
    };
    const alTerminar = () => {
      if (gesto.current === "bajar") {
        soltar();
        return;
      }
      inicioY.current = null;
      gesto.current = "nada";
    };

    cuerpo.addEventListener("touchstart", alEmpezar, { passive: true });
    cuerpo.addEventListener("touchmove", alMover, { passive: false });
    cuerpo.addEventListener("touchend", alTerminar);
    cuerpo.addEventListener("touchcancel", alTerminar);
    return () => {
      cuerpo.removeEventListener("touchstart", alEmpezar);
      cuerpo.removeEventListener("touchmove", alMover);
      cuerpo.removeEventListener("touchend", alTerminar);
      cuerpo.removeEventListener("touchcancel", alTerminar);
    };
    // `soltar` y `mover` solo usan refs y setters estables.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo]);

  /** `true` si el clic que acaba de llegar es el final de un arrastre. */
  const fueArrastre = () => {
    const fue = seMovio.current;
    seMovio.current = false;
    return fue;
  };

  return { desplazamiento, arrastrando, manija, cuerpoRef, fueArrastre };
}
