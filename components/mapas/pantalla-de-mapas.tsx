"use client";

import type { ReactNode } from "react";
import { useDatosDeLaApp, type DatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { BotonVolver } from "@/components/ui/boton-volver";
import { Enlace } from "@/components/ui/enlace";
import { Tarjeta } from "@/components/ui/tarjeta";

/**
 * Lo común de las cuatro pantallas de Mapas: Consultas, Marcas, Zonas y
 * Descargas.
 *
 * **Mapas es solo con conexión** (decisión 052). Sin señal desaparece del
 * menú, y si la señal se va con la pantalla abierta, se dice en pantalla y se
 * ofrece lo que sí anda: Circuitos y la navegación libre.
 *
 * Arriba va solo el nombre de la pantalla. Las pestañas se fueron al menú:
 * adentro de cada pantalla la elección ya quedó atrás. En el celular, al lado
 * del nombre va la flecha que vuelve a la pantalla «Mapas», donde se eligió.
 */
export function PantallaDeMapas({
  titulo,
  children,
  ancha = false,
  avisaIncompletoSola = false,
  accion,
  esLaEntrada = false,
  encabezadoAdentro = false,
}: {
  titulo: string;
  children: (datos: DatosDeLaApp) => ReactNode;
  /** `true` para las pantallas de lista y mapa, que usan todo el ancho. */
  ancha?: boolean;
  /** `true` cuando la pantalla muestra por su cuenta el aviso de datos incompletos. */
  avisaIncompletoSola?: boolean;
  /** Lo que va a la derecha del título, como el «+» de Zonas. Solo con señal y datos. */
  accion?: ReactNode;
  /**
   * `true` para la pantalla «Mapas» misma: no tiene adónde volver y no espera
   * los datos de la app, porque solo muestra las cuatro entradas.
   */
  esLaEntrada?: boolean;
  /**
   * `true` mientras está abierta una pantalla interna (como «Camino nuevo»),
   * que dibuja su propio {@link EncabezadoDeMapas} con subtítulo y su flecha.
   * Así no quedan dos títulos ni dos flechas que hacen cosas distintas.
   */
  encabezadoAdentro?: boolean;
}) {
  const haySenal = useHaySenal();
  const datos = useDatosDeLaApp();
  const conDatos = datos.estado !== "abriendo" && datos.estado !== "sin_datos";
  // La pantalla interna pone su encabezado solo mientras se ve: si se va la
  // señal o faltan los datos, vuelve el de siempre.
  const encabezadoPropio = !(encabezadoAdentro && haySenal && conDatos);

  return (
    <div className={`space-y-3 ${ancha ? "" : "max-w-3xl"}`}>
      {encabezadoPropio ? (
        <EncabezadoDeMapas titulo={titulo} esLaEntrada={esLaEntrada} accion={haySenal && conDatos ? accion : null} />
      ) : null}
      {!haySenal ? (
        <Tarjeta franja="ambar" className="space-y-3">
          <p role="status" className="text-base text-texto">Mapas necesita conexión. Cuando haya señal, se abre solo.</p>
          <p className="text-base text-texto-suave">Podés consultar tus Circuitos y navegar con los mapas que bajaste.</p>
          <div className="flex flex-wrap gap-2">
            <Enlace href="/circuitos" variante="secundario">Circuitos</Enlace>
            <Enlace href="/mapa-libre" variante="secundario">Navegación libre</Enlace>
          </div>
        </Tarjeta>
      ) : esLaEntrada ? (
        children(datos)
      ) : datos.estado === "abriendo" ? (
        <Tarjeta className="py-8 text-center text-base text-texto-suave">
          <p role="status">Abriendo los mapas…</p>
        </Tarjeta>
      ) : datos.estado === "sin_datos" ? (
        <Tarjeta franja="ambar" className="space-y-2">
          <p className="text-base font-medium text-texto">Todavía no llegaron los datos de la app.</p>
          <p role="alert" className="text-base leading-6 text-texto-suave">
            {datos.aviso ?? "Recargá la pantalla para volver a intentar."}
          </p>
        </Tarjeta>
      ) : (
        <>
          {datos.estado === "incompleto" && datos.aviso && !avisaIncompletoSola ? (
            <Tarjeta franja="ambar">
              <p role="alert" className="text-base leading-6 text-ambar-texto">
                Lo que ves puede estar incompleto: {datos.aviso}. Recargá para intentar de nuevo.
              </p>
            </Tarjeta>
          ) : null}
          {children(datos)}
        </>
      )}
    </div>
  );
}

/**
 * El encabezado de las pantallas de Mapas. Con `subtitulo` es el de una
 * pantalla interna —«Marcas / Camino nuevo»— y su única flecha vuelve a la
 * pantalla de arriba, también en la computadora. Sin subtítulo, la flecha
 * solo está en el celular y vuelve a «Mapas».
 */
export function EncabezadoDeMapas({
  titulo,
  subtitulo,
  alVolver,
  volverDeshabilitado = false,
  esLaEntrada = false,
  accion,
}: {
  titulo: string;
  subtitulo?: string;
  /** Para las pantallas internas: qué hace la flecha. */
  alVolver?: () => void;
  volverDeshabilitado?: boolean;
  esLaEntrada?: boolean;
  accion?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      {subtitulo !== undefined ? (
        <BotonVolver alVolver={alVolver} disabled={volverDeshabilitado} />
      ) : esLaEntrada ? null : (
        <BotonVolver destinoSiNoHayVuelta="/mapas" className="lg:hidden" />
      )}
      <h1 className="min-w-0 flex-1 text-2xl font-bold uppercase text-texto">
        {subtitulo !== undefined ? `${titulo} / ${subtitulo}` : titulo}
      </h1>
      {accion}
    </div>
  );
}
