"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { CamposDeAnotacion } from "@/components/anotaciones/campos-de-anotacion";
import { BotonRedondo } from "@/components/ui/boton-redondo";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Desplegable } from "@/components/ui/desplegable";
import { useDialogos } from "@/components/ui/dialogos";
import { usePuntos } from "@/hooks/use-puntos";
import { COLOR_DE_TRAZO_POR_DEFECTO } from "@/lib/anotaciones/colores-de-trazo";
import { COMO_SE_LLAMA } from "@/lib/anotaciones/iconos";
import { caeDentroDe } from "@/lib/anotaciones/lugar";
import { filtrarPuntos, type FiltroDeLugar } from "@/lib/anotaciones/filtros-de-puntos";
import { CORDOBA_COMPLETA } from "@/lib/mapas/general";
import { ICONOS_PUNTO, type IconoPunto } from "@/types/database";
import type { Anotacion } from "@/types/database";

type Props = { soyAdministrador: boolean };
export function PantallaDePuntos({ soyAdministrador }: Props) {
  const puntos = usePuntos();
  const { confirmar } = useDialogos();
  const fotoLista = puntos.foto.estado === "vacio" || puntos.foto.estado === "lista";
  const [filtroDeLugar, setFiltroDeLugar] = useState<FiltroDeLugar | null>(null);
  const [filtroDeIcono, setFiltroDeIcono] = useState<IconoPunto | null>(null);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const formulario = useRef<HTMLFormElement>(null);
  const contenedorFormulario = useRef<HTMLDivElement>(null);
  const puedeEditar = soyAdministrador && puntos.haySenal;

  useEffect(() => {
    if (!formularioAbierto) return;
    const cuadro = window.requestAnimationFrame(() =>
      contenedorFormulario.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
    return () => window.cancelAnimationFrame(cuadro);
  }, [formularioAbierto]);

  useEffect(() => {
    // Espera a que el formulario deje de estar deshabilitado tras guardar.
    if (!puntos.mensaje || puntos.guardando) return;
    const entrada = formulario.current?.elements.namedItem("coordenada-del-punto");
    if (entrada instanceof HTMLElement) entrada.focus();
  }, [puntos.mensaje, puntos.guardando]);

  const opcionesDeLugar = useMemo(() => [
    ...puntos.zonas.map((zona) => ({ valor: `zona:${zona.id}` as const, etiqueta: `Zona · ${zona.nombre}` })),
    ...puntos.sectores.map((sector) => {
      const zona = puntos.zonas.find((cada) => cada.id === sector.zonaId);
      return { valor: `sector:${sector.id}` as const, etiqueta: `Sector · ${zona?.nombre ?? "Zona desconocida"} · ${sector.nombre}` };
    }),
  ], [puntos.zonas, puntos.sectores]);
  const opcionesDeIcono = useMemo(
    () => ICONOS_PUNTO.map((icono) => ({ valor: icono, etiqueta: COMO_SE_LLAMA[icono] })),
    [],
  );
  const puntosFiltrados = useMemo(
    () => filtrarPuntos(puntos.puntos, filtroDeLugar, filtroDeIcono, puntos.zonas, puntos.sectores),
    [puntos.puntos, filtroDeLugar, filtroDeIcono, puntos.zonas, puntos.sectores],
  );
  const ubicacionDe = (punto: Anotacion) => {
    const sector = puntos.sectores.find((cada) => cada.id === punto.sectorId)
      ?? (punto.geometria.type === "Point" ? puntos.sectores.find((cada) => caeDentroDe(punto, cada.rectangulo)) : undefined);
    const zona = (sector && puntos.zonas.find((cada) => cada.id === sector.zonaId))
      ?? (punto.geometria.type === "Point" ? puntos.zonas.find((cada) => caeDentroDe(punto, cada.rectangulo)) : undefined);
    return `${zona?.nombre ?? "Sin zona"} · ${sector?.nombre ?? "Sin sector"}`;
  };

  function abrirPunto(id: number) {
    puntos.abrir(id);
    setFormularioAbierto(true);
  }

  function agregarPunto() {
    puntos.limpiar();
    setFormularioAbierto(true);
  }

  function cerrarFormulario() {
    puntos.limpiar();
    setFormularioAbierto(false);
  }

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    await puntos.guardar();
  }

  async function confirmarBorrado() {
    if (await confirmar({
      titulo: "¿Borrar este punto?",
      mensaje: "Deja de aparecer en los mapas de todos. Su foto también deja de mostrarse.",
      textoDeAceptar: "Borrar", destructivo: true,
    }) && await puntos.borrar()) setFormularioAbierto(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {puntos.estado === "abriendo" ? (
        <Tarjeta><p role="status" className="text-base text-texto-suave">Abriendo los puntos…</p></Tarjeta>
      ) : puntos.estado === "sin_datos" ? (
        <Tarjeta franja="ambar">
          <p role="alert" className="text-base text-texto">{puntos.aviso ?? "No se pudieron cargar los puntos."} Recargá la pantalla para volver a intentar.</p>
        </Tarjeta>
      ) : (
        <>
          {puntos.aviso ? (
            <Tarjeta franja="ambar"><p role="alert" className="text-base text-texto">La lista de puntos puede estar incompleta: {puntos.aviso}. Recargá para volver a intentar.</p></Tarjeta>
          ) : null}
          <CargadorDeMapa enVivo principal alturaExtendida encuadre={CORDOBA_COMPLETA}
            anotaciones={puntos.enElMapa} alTocarAnotacion={puedeEditar ? abrirPunto : undefined} />

          <section aria-labelledby="titulo-puntos-marcados" className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 id="titulo-puntos-marcados" className="text-lg font-semibold uppercase text-texto">Puntos marcados</h2>
              {puedeEditar ? (
                <BotonRedondo etiqueta="Agregar un punto" variante="principal" onClick={agregarPunto}>
                  <path d="M12 5v14M5 12h14" />
                </BotonRedondo>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Desplegable
                etiqueta="Zona y sector"
                opciones={opcionesDeLugar}
                elegida={filtroDeLugar}
                alElegir={setFiltroDeLugar}
                textoDeNinguna="Todas las zonas y sectores"
              />
              <Desplegable
                etiqueta="Tipo de icono"
                opciones={opcionesDeIcono}
                elegida={filtroDeIcono}
                alElegir={setFiltroDeIcono}
                textoDeNinguna="Todos los iconos"
              />
            </div>

            {puntosFiltrados.length === 0 ? (
              <Tarjeta className="text-center">
                <p className="text-base font-medium text-texto-suave">
                  {puntos.puntos.length === 0 ? "Todavía no hay puntos marcados." : "No hay puntos con estos filtros."}
                </p>
                {puedeEditar && puntos.puntos.length === 0 ? (
                  <p className="mt-1 text-sm leading-6 text-texto-suave">Usá el botón más para agregar el primero.</p>
                ) : null}
              </Tarjeta>
            ) : (
              <ul className="space-y-2">
                {puntosFiltrados.map((punto) => {
                  const icono = punto.icono ?? "cruce";
                  const etiqueta = punto.comentario?.trim() || COMO_SE_LLAMA[icono];
                  return (
                    <li key={punto.id}>
                      {puedeEditar ? (
                        <button type="button" onClick={() => abrirPunto(punto.id)}
                          className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-borde bg-superficie px-3 py-2 text-left hover:bg-superficie-alta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde">
                          <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-verde-fondo text-sm font-bold text-verde-texto">{COMO_SE_LLAMA[icono].slice(0, 2).toUpperCase()}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-base font-semibold text-texto">{etiqueta}</span>
                            <span className="block truncate text-sm text-texto-suave">{COMO_SE_LLAMA[icono]} · {ubicacionDe(punto)}</span>
                          </span>
                        </button>
                      ) : (
                        <div className="flex min-h-14 items-center gap-3 rounded-xl border border-borde bg-superficie px-3 py-2">
                          <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-verde-fondo text-sm font-bold text-verde-texto">{COMO_SE_LLAMA[icono].slice(0, 2).toUpperCase()}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-base font-semibold text-texto">{etiqueta}</span>
                            <span className="block truncate text-sm text-texto-suave">{COMO_SE_LLAMA[icono]} · {ubicacionDe(punto)}</span>
                          </span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {formularioAbierto && soyAdministrador ? (
            <div ref={contenedorFormulario}>
            <Tarjeta className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-texto">{puntos.seleccionado ? "Editar el punto" : "Punto nuevo"}</h2>
                <Boton variante="secundario" onClick={cerrarFormulario}>Cerrar</Boton>
              </div>
              {puntos.mensaje ? <p role="status" className="text-base text-texto">{puntos.mensaje}</p> : null}
              {puntos.error ? <p role="alert" className="text-base text-rojo-texto">{puntos.error}</p> : null}
              <form ref={formulario} onSubmit={(evento) => void alEnviar(evento)}>
              <fieldset disabled={puntos.guardando || !puntos.haySenal} className="min-w-0 space-y-3">
                <Campo label="Pegá la coordenada" id="coordenada-del-punto"
                  value={puntos.coordenada} onChange={(evento) => puntos.setCoordenada(evento.target.value)}
                  placeholder={'31°16\'31.0"S 64°19\'13.3"W'}
                  ayuda="Copiala de Google Earth y pegala tal cual."
                  error={puntos.lectura.clase === "error" ? `${puntos.lectura.titulo} ${puntos.lectura.detalle}` : undefined} />
                {puntos.lectura.clase === "leida" ? (
                  <p className="text-base text-texto-suave">{puntos.lectura.lat.toFixed(5)}, {puntos.lectura.lon.toFixed(5)}{puntos.lectura.aviso ? ` · ${puntos.lectura.aviso}` : ""}</p>
                ) : null}
                <CamposDeAnotacion tipo="punto" icono={puntos.icono} alCambiarIcono={puntos.setIcono}
                  color={COLOR_DE_TRAZO_POR_DEFECTO} alCambiarColor={() => {}}
                  comentario={puntos.comentario} alCambiarComentario={puntos.setComentario}
                  foto={puntos.foto} fotoActual={puntos.quitarLaFoto ? null : puntos.seleccionado?.fotoUrl ?? null}
                  alQuitarFotoActual={() => puntos.setQuitarLaFoto(true)} guardando={puntos.guardando} />
                {puntos.haySenal ? (
                  <>
                    <Boton type="submit" anchoCompleto disabled={puntos.guardando || puntos.lectura.clase !== "leida" || !fotoLista}>
                      {puntos.guardando ? "Guardando…" : "Guardar el punto"}
                    </Boton>
                    {puntos.seleccionado ? (
                      <div className="flex gap-2">
                        <Boton variante="secundario" anchoCompleto onClick={puntos.limpiar}>Punto nuevo</Boton>
                        <Boton variante="destructivo" anchoCompleto onClick={() => void confirmarBorrado()}>Borrar el punto</Boton>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </fieldset>
            </form>
            </Tarjeta>
            </div>
          ) : null}
          {!formularioAbierto && puntos.mensaje ? <Tarjeta><p role="status" className="text-base text-texto">{puntos.mensaje}</p></Tarjeta> : null}
          {!formularioAbierto && puntos.error ? <Tarjeta franja="ambar"><p role="alert" className="text-base text-rojo-texto">{puntos.error}</p></Tarjeta> : null}
        </>
      )}
    </div>
  );
}
