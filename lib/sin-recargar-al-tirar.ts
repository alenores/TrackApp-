import { SELECTOR_DEL_MAPA } from "@/lib/sin-zoom";

/**
 * El gesto de «tirar hacia abajo para recargar» no existe en esta app.
 *
 * Chrome en el celular recarga la página entera cuando se tira hacia abajo
 * estando arriba de todo. Acá eso no sirve para nada —la app se pone al día
 * sola al abrir— y en el cerro, con guantes o la pantalla mojada, un tirón
 * sin querer recarga el mapa en el medio de una navegación. Decidido por Ale
 * el 2026-09-21: queda igual que en Vías de Escalada, donde no está.
 *
 * La regla de estilos que lo desactiva ya estaba puesta y en el celular igual
 * aparecía. Esto no depende de ella: la app mira el gesto y, si es un tirón
 * hacia abajo con nada más para desplazar hacia arriba, lo ignora. El mapa se
 * maneja solo y no se toca.
 */

/** El elemento que de verdad se desplaza bajo el dedo, si hay alguno. */
function elQueSeDesplaza(desde: Element | null): HTMLElement | null {
  let actual: Element | null = desde;
  while (actual instanceof HTMLElement) {
    const { overflowY } = getComputedStyle(actual);
    const seDesplaza = (overflowY === "auto" || overflowY === "scroll") &&
      actual.scrollHeight > actual.clientHeight;
    if (seDesplaza) return actual;
    actual = actual.parentElement;
  }
  return null;
}

/** La decisión, sola, para poder probarla. */
export function hayQueIgnorarElTiron(estado: {
  haciaAbajo: boolean;
  enElMapa: boolean;
  quedaAlgoArriba: boolean;
}): boolean {
  if (estado.enElMapa) return false;
  if (!estado.haciaAbajo) return false;
  return !estado.quedaAlgoArriba;
}

export function trabarElTirarParaRecargar(): () => void {
  if (typeof document === "undefined") return () => {};

  let dondeEmpezo = 0;

  const alApoyar = (evento: TouchEvent) => {
    dondeEmpezo = evento.touches[0]?.clientY ?? 0;
  };

  const alMover = (evento: TouchEvent) => {
    if (evento.touches.length !== 1 || !evento.cancelable) return;
    const donde = evento.target instanceof Element ? evento.target : null;
    const desplazable = elQueSeDesplaza(donde);

    const ignorar = hayQueIgnorarElTiron({
      haciaAbajo: evento.touches[0].clientY > dondeEmpezo,
      enElMapa: donde?.closest(SELECTOR_DEL_MAPA) !== null,
      quedaAlgoArriba: desplazable !== null && desplazable.scrollTop > 0,
    });

    if (ignorar) evento.preventDefault();
  };

  document.addEventListener("touchstart", alApoyar, { passive: true, capture: true });
  document.addEventListener("touchmove", alMover, { passive: false, capture: true });

  return () => {
    document.removeEventListener("touchstart", alApoyar, { capture: true });
    document.removeEventListener("touchmove", alMover, { capture: true });
  };
}
