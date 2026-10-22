"use client";

import { useRouter } from "next/navigation";
import { useCallback, useLayoutEffect, useRef, useState, type PointerEvent as EventoDePuntero, type ReactNode, type TouchEvent as EventoDeToque } from "react";
import { BotonVolver } from "@/components/ui/boton-volver";
import { LugarAlCostado } from "@/components/ui/emergente";
import { useArrastreHaciaAbajo } from "@/hooks/use-arrastre-hacia-abajo";
import { useCerrarConAtras } from "@/hooks/use-cerrar-con-atras";
import { usePantallaAncha } from "@/hooks/use-pantalla-ancha";

/**
 * **Lista y mapa: los dos momentos de mirar marcas** (decisión 052).
 *
 * Uno es elegir qué ver y el otro es mirarlo. No entran juntos en la misma
 * pantalla del celular, pero tienen que estar a un gesto de distancia.
 *
 * - **En la computadora**, lado a lado: la lista a la izquierda y el mapa a la
 *   derecha. Cada cambio se ve al instante.
 * - **En el celular**, el mapa ocupa la pantalla y la lista es un panel que
 *   sube desde abajo. Bajado, queda una barrita con el resumen. Se sube
 *   tocándola; se baja con el dedo o el mouse, tocando su cabecera, tocando
 *   afuera o con el botón físico de atrás. Los gestos son los de Vías de Escalada: desde la lista, bajar solo
 *   baja el panel si la lista ya está arriba del todo.
 *
 * No hay deslizar de costado para pasar de uno a otro: en el mapa, deslizar es
 * mover el mapa.
 *
 * El mapa trae su propio «Ver el mapa en grande», que es solo para mirar.
 */

type Propiedades = {
  /** El título del panel, también el nombre de la lista para quien no ve. */
  tituloDelPanel: string;
  /** Lo que dice la barrita del celular con el panel bajado. */
  resumen: ReactNode;
  /** Lo que va adentro del panel: filtros, lista. */
  panel: ReactNode;
  /** Lo que va arriba del panel, fijo, sin moverse con la lista. */
  cabezaDelPanel?: ReactNode;
  /** El mapa, con `llenarElLugar`. */
  mapa: ReactNode;
  /** En el celular, si el panel está arriba. En la computadora no cambia nada. */
  abierto: boolean;
  alCambiarAbierto: (abierto: boolean) => void;
  /** `true` cuando el panel trae pocas cosas, como los filtros de Consultas: no se estira. */
  panelCorto?: boolean;
  /**
   * Lo que va siempre a la vista, afuera del panel: la referencia de colores y
   * líneas. En el celular, abajo de la barrita; en la computadora, abajo de la
   * lista.
   */
  pie?: ReactNode;
  /**
   * En el celular, ocupar toda la pantalla, sin la barra de abajo ni el
   * encabezado, como la navegación libre: el mapa a todo lo alto y la barrita
   * pegada abajo de todo. Lleva el nombre de la pantalla, que va arriba junto
   * al botón de volver: siempre hay una salida visible.
   */
  pantallaCompletaEnCelular?: string;
  /** Adónde lleva el volver de la pantalla completa si no hay pantalla anterior. */
  destinoSiNoHayVuelta?: string;
  /** Avisos de la pantalla (cargando, algo falló): van arriba del mapa, siempre a la vista. */
  avisos?: ReactNode;
  /** Lo que va en el encabezado del panel, a la derecha del título: el «+» de agregar. */
  accionDelEncabezado?: ReactNode;
  /** Acceso siempre visible fuera del mapa: junto al título en PC y celular. */
  accionDePantalla?: ReactNode;
};

/** Cuánto hay que deslizar hacia arriba el panel asomado para que suba. */
const DESLIZAR_PARA_SUBIR = 24;

export function ListaYMapa({ tituloDelPanel, resumen, panel, cabezaDelPanel, mapa, abierto, alCambiarAbierto, panelCorto = false, pie, pantallaCompletaEnCelular, destinoSiNoHayVuelta = "/", avisos, accionDelEncabezado, accionDePantalla }: Propiedades) {
  const ancha = usePantallaAncha();
  const [lugarAlCostado, setLugarAlCostado] = useState<HTMLElement | null>(null);
  const router = useRouter();
  /**
   * Volver de la pantalla completa. Abrir y cerrar el panel deja pasos de más
   * en el historial con esta misma dirección: volver una vez puede caer en la
   * misma pantalla y parecer que el botón no hace nada. Si después de volver
   * seguimos acá, se va al destino de respaldo. Mapas es solo con conexión: ir a una
   * dirección acá no deja nada en blanco.
   */
  const volverDeVerdad = useCallback(() => {
    const antes = window.location.pathname;
    router.back();
    window.setTimeout(() => {
      if (window.location.pathname === antes) router.push(destinoSiNoHayVuelta);
    }, 600);
  }, [router, destinoSiNoHayVuelta]);
  // Quien lo usa puede pasar una función nueva en cada dibujo; el atrás del
  // celular necesita una que no cambie.
  const alCambiarRef = useRef(alCambiarAbierto);
  useLayoutEffect(() => { alCambiarRef.current = alCambiarAbierto; }, [alCambiarAbierto]);
  const bajar = useCallback(() => alCambiarRef.current(false), []);
  const arriba = abierto && !ancha;
  const { desplazamiento, arrastrando, manija, cuerpoRef, fueArrastre } = useArrastreHaciaAbajo({ activo: arriba, alIrse: bajar, salida: "al-instante" });

  // Con el panel arriba, el atrás del celular lo baja y no sale de la
  // pantalla. Con el panel abajo, el atrás sale como siempre.
  useCerrarConAtras(arriba, bajar);

  // Subir el panel asomado: deslizándolo hacia arriba o tocándolo. Mientras
  // el dedo (o el mouse) sube, el panel lo sigue; al soltar termina de subir
  // o vuelve a bajar, suave. El toque que llega al soltar cae sobre el panel
  // recién abierto: por un instante no cuenta, si no lo volvería a bajar.
  const abiertoEn = useRef(0);
  const inicioDeSubida = useRef<number | null>(null);
  const subiendo = useRef(false);
  const panelRef = useRef<HTMLElement | null>(null);
  const asomadoRef = useRef<HTMLDivElement | null>(null);
  /** Cuánto falta para que el panel quede arriba del todo, mientras sube con el dedo. */
  const [subida, setSubida] = useState<number | null>(null);
  const [siguiendoAlDedo, setSiguiendoAlDedo] = useState(false);

  const recorrido = useCallback(() => {
    const alto = panelRef.current?.offsetHeight ?? window.innerHeight * 0.6;
    const asomado = asomadoRef.current?.offsetHeight ?? 0;
    return Math.max(0, alto - asomado);
  }, []);
  const recienAbierto = useCallback(() => Date.now() - abiertoEn.current < 500, []);

  /** Un toque: el panel aparece abajo y sube solo, suave. */
  const subir = useCallback(() => {
    abiertoEn.current = Date.now();
    setSubida(window.innerHeight * 0.6);
    alCambiarRef.current(true);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => setSubida(null)));
  }, []);

  const empezarSubida = useCallback((y: number) => {
    inicioDeSubida.current = y;
    subiendo.current = false;
  }, []);
  const moverSubida = useCallback((y: number) => {
    if (inicioDeSubida.current === null) return;
    const cuanto = inicioDeSubida.current - y;
    if (!subiendo.current) {
      if (cuanto < 4) return;
      subiendo.current = true;
      abiertoEn.current = Date.now();
      setSiguiendoAlDedo(true);
      setSubida(window.innerHeight * 0.6);
      alCambiarRef.current(true);
    }
    setSubida(Math.max(0, recorrido() - cuanto));
  }, [recorrido]);
  const terminarSubida = useCallback((y: number | null) => {
    const inicio = inicioDeSubida.current;
    inicioDeSubida.current = null;
    if (!subiendo.current || inicio === null) return;
    subiendo.current = false;
    abiertoEn.current = Date.now();
    setSiguiendoAlDedo(false);
    const cuanto = y === null ? 0 : inicio - y;
    if (cuanto > DESLIZAR_PARA_SUBIR * 2.5) {
      setSubida(null);
      return;
    }
    // No subió lo suficiente: vuelve a bajar, suave, y recién ahí se cierra.
    setSubida(recorrido());
    window.setTimeout(() => {
      alCambiarRef.current(false);
      setSubida(null);
    }, 200);
  }, [recorrido]);

  const ultimaY = useRef<number | null>(null);
  const gestoParaSubir = {
    onTouchStart: (evento: EventoDeToque) => {
      const y = evento.touches[0]?.clientY;
      if (y !== undefined) { ultimaY.current = y; empezarSubida(y); }
    },
    onTouchMove: (evento: EventoDeToque) => {
      const y = evento.touches[0]?.clientY;
      if (y !== undefined) { ultimaY.current = y; moverSubida(y); }
    },
    onTouchEnd: () => terminarSubida(ultimaY.current),
    onTouchCancel: () => terminarSubida(null),
    onPointerDown: (evento: EventoDePuntero) => {
      if (evento.pointerType !== "mouse" || evento.button !== 0) return;
      empezarSubida(evento.clientY);
      const alMover = (movimiento: PointerEvent) => moverSubida(movimiento.clientY);
      const alSoltar = (soltado: PointerEvent) => {
        window.removeEventListener("pointermove", alMover);
        window.removeEventListener("pointerup", alSoltar);
        terminarSubida(soltado.clientY);
      };
      window.addEventListener("pointermove", alMover);
      window.addEventListener("pointerup", alSoltar);
    },
  };

  if (ancha) {
    return (
      // Ocupa el alto que le queda debajo del título y los avisos, sin
      // adivinarlo: la página no se desliza (`[data-pantalla-fija]`).
      <LugarAlCostado.Provider value={lugarAlCostado}>
      <div data-pantalla-fija className="flex flex-col gap-3">
      {avisos ? <div className="shrink-0 space-y-2">{avisos}</div> : null}
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(20rem,26rem)_1fr] grid-rows-[minmax(0,1fr)] gap-4">
        <section aria-label={tituloDelPanel} className="panel-que-sube relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-panel-borde bg-panel">
          <div className="cabeza-de-panel flex shrink-0 items-center gap-3 border-b border-borde px-4 py-2">
            <h2 className="min-h-10 min-w-0 flex-1 content-center truncate text-base font-bold text-texto">{tituloDelPanel}</h2>
            {accionDePantalla}
            {accionDelEncabezado}
          </div>
          {cabezaDelPanel ? <div className="shrink-0 border-b border-borde px-4 py-3">{cabezaDelPanel}</div> : null}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">{panel}</div>
          {pie ? <div className="shrink-0 border-t border-borde px-4 py-3">{pie}</div> : null}
          {/* La ficha de lo que se toca en el mapa se abre acá: tapa la lista, no el mapa. */}
          <div ref={setLugarAlCostado} className="absolute inset-0 z-10 flex flex-col bg-panel empty:hidden" />
        </section>
        <div className="min-h-0">{mapa}</div>
      </div>
      </div>
      </LugarAlCostado.Provider>
    );
  }

  return (
    <div className={pantallaCompletaEnCelular
      ? "fixed inset-0 z-50 flex flex-col gap-2 bg-fondo px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-[calc(env(safe-area-inset-top)+0.5rem)]"
      : "relative flex h-[calc(100dvh-14rem-env(safe-area-inset-bottom))] min-h-[24rem] flex-col gap-2"}>
      {pantallaCompletaEnCelular ? (
        <div className="flex shrink-0 items-center gap-2">
          <BotonVolver alVolver={volverDeVerdad} />
          <h1 className="min-w-0 flex-1 truncate text-xl font-bold uppercase text-texto">{pantallaCompletaEnCelular}</h1>
          {accionDePantalla}
        </div>
      ) : null}
      {avisos ? <div className="shrink-0 space-y-2">{avisos}</div> : null}
      <div className="min-h-0 flex-1">{mapa}</div>

      {/*
        El panel asomado: la parte de arriba del panel, a todo el ancho y
        pegada abajo de todo, con su manija. Se desliza hacia arriba o se toca
        para traerlo entero.
      */}
      <div ref={asomadoRef} role="button" tabIndex={0} aria-expanded={false} aria-label={`Abrir ${tituloDelPanel.toLowerCase()}`}
        onClick={() => { if (!recienAbierto()) subir(); }}
        onKeyDown={(evento) => { if (evento.key === "Enter" || evento.key === " ") { evento.preventDefault(); subir(); } }}
        {...gestoParaSubir}
        className={`cabeza-de-panel shrink-0 cursor-pointer touch-none select-none border border-panel-borde shadow-[var(--sombra-alta)] ${pantallaCompletaEnCelular
          ? "-mx-2 -mb-[calc(env(safe-area-inset-bottom)+0.5rem)] rounded-t-2xl border-b-0 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]"
          : "rounded-2xl"}`}>
        <div className="flex justify-center pt-2.5" aria-hidden>
          <span className="h-1 w-9 rounded-full bg-borde-fuerte" />
        </div>
        <div className="flex min-h-12 items-center gap-3 px-4 pb-2 pt-1">
          <span className="min-w-0 flex-1">
            <span className="block text-base font-bold text-texto">{tituloDelPanel}</span>
            <span className="block truncate text-sm text-texto-suave">{resumen}</span>
          </span>
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-texto-suave" aria-hidden
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 15 6-6 6 6" /></svg>
        </div>
      </div>

      {pie ? <div className="shrink-0 rounded-xl border border-borde bg-superficie px-3 py-2">{pie}</div> : null}

      {arriba ? (
        <>
          {/* Tocar afuera del panel lo baja: arriba es para elegir, no para usar el mapa. */}
          <button type="button" aria-label="Ver mapa" tabIndex={-1} onClick={() => { if (!recienAbierto()) bajar(); }}
            className="absolute inset-0 z-[5] cursor-default" />
          <section ref={panelRef} aria-label={tituloDelPanel}
            style={subida !== null
              ? { transform: `translateY(${subida}px)` }
              : desplazamiento > 0 ? { transform: `translateY(${desplazamiento}px)` } : undefined}
            className={`absolute inset-x-0 bottom-0 z-10 flex max-h-[88%] flex-col ${panelCorto ? "" : "min-h-[60%]"} overflow-hidden rounded-2xl border border-panel-borde bg-panel shadow-[var(--sombra-alta)] panel-que-sube ${arrastrando || siguiendoAlDedo ? "" : "transition-transform duration-200 ease-out"}`}>
            {/* La cabecera se toca entera para bajar, igual que la barrita se toca entera para subir. */}
            <div role="button" tabIndex={0} aria-label={`Bajar ${tituloDelPanel.toLowerCase()} y ver el mapa`}
              onClick={() => { if (!fueArrastre() && !recienAbierto()) bajar(); }}
              onKeyDown={(evento) => { if (evento.key === "Enter" || evento.key === " ") { evento.preventDefault(); bajar(); } }}
              className="cabeza-de-panel shrink-0 cursor-pointer touch-none select-none border-b border-borde" {...manija}>
              <div className="flex justify-center pt-2.5" aria-hidden>
                <span className="h-1 w-9 rounded-full bg-borde-fuerte" />
              </div>
              <div className="flex min-h-12 items-center gap-3 px-4 pb-2 pt-1">
                <h2 className="min-w-0 flex-1 truncate text-base font-bold text-texto">{tituloDelPanel}</h2>
                {accionDelEncabezado ? (
                  // El encabezado se toca para bajar el panel: el «+» no tiene que bajarlo.
                  <div onClick={(evento) => evento.stopPropagation()} onPointerDown={(evento) => evento.stopPropagation()}
                    onTouchStart={(evento) => evento.stopPropagation()}>
                    {accionDelEncabezado}
                  </div>
                ) : null}
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-texto-suave" aria-hidden
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
              </div>
            </div>
            {cabezaDelPanel ? <div className="shrink-0 border-b border-borde px-4 py-3">{cabezaDelPanel}</div> : null}
            <div ref={cuerpoRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">{panel}</div>
          </section>
        </>
      ) : null}
    </div>
  );
}
