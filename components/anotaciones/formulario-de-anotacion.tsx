"use client";

import type { FormEvent } from "react";
import { CamposDeAnotacion } from "@/components/anotaciones/campos-de-anotacion";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";
import { useDialogos } from "@/components/ui/dialogos";
import { Tarjeta } from "@/components/ui/tarjeta";
import { PUNTOS_MINIMOS_DE_UN_TRAZO, type useAnotaciones } from "@/hooks/use-anotaciones";
import { COLOR_DE_TRAZO_POR_DEFECTO } from "@/lib/anotaciones/colores-de-trazo";

/**
 * El formulario de una anotación, igual en Mapas y en el sector: dónde está
 * (o por dónde va), qué es, qué hay que saber y la foto. Borrar está acá
 * adentro y pide confirmación: nunca a un toque desde la lista.
 */

type Anotar = ReturnType<typeof useAnotaciones>;

const CLASE_DE_TITULO = "text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave";

export function FormularioDeAnotacion({ anotar }: { anotar: Anotar }) {
  const { confirmar } = useDialogos();
  const { borrador, seleccionado, lectura } = anotar;
  if (!borrador) return null;

  const esPunto = borrador.tipo === "punto";
  const nombre = esPunto ? "punto" : "trazo";
  const titulo = seleccionado ? `Editar el ${nombre}` : esPunto ? "Punto nuevo" : "Trazo nuevo";

  const alEnviar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    void anotar.guardar();
  };

  const alBorrar = async () => {
    const seguro = await confirmar({
      titulo: `¿Borrar este ${nombre}?`,
      mensaje: "Deja de aparecer en los mapas de todos, también su foto.",
      textoDeAceptar: `Borrar el ${nombre}`,
      destructivo: true,
    });
    if (seguro) await anotar.borrar();
  };

  return (
    <Tarjeta className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-texto">{titulo}</h2>
        <Boton variante="secundario" disabled={anotar.guardando} onClick={anotar.cerrar}>
          Cerrar
        </Boton>
      </div>

      <form onSubmit={alEnviar}>
        <fieldset disabled={anotar.guardando || !anotar.haySenal} className="min-w-0 space-y-4">
          {borrador.tipo === "punto" ? (
            <div className="space-y-2">
              <h3 className={CLASE_DE_TITULO}>Dónde está</h3>
              <Campo
                label="Tocá el mapa, o pegá la coordenada de Google Earth"
                id="coordenada-de-la-anotacion"
                value={anotar.coordenada}
                onChange={(evento) => anotar.setCoordenada(evento.target.value)}
                placeholder={`31°16'31.0"S 64°19'13.3"W`}
                error={
                  lectura.clase === "error" ? `${lectura.titulo} ${lectura.detalle}` : undefined
                }
              />
              {lectura.clase === "leida" ? (
                <p className="text-sm tabular-nums text-texto-suave">
                  {lectura.lat.toFixed(5)}, {lectura.lon.toFixed(5)}
                  {lectura.aviso ? ` · ${lectura.aviso}` : ""}
                </p>
              ) : null}
              <Boton
                variante={anotar.marcando ? "principal" : "secundario"}
                anchoCompleto
                onClick={() => anotar.setMarcando(!anotar.marcando)}
              >
                {anotar.marcando
                  ? "Tocá el mapa…"
                  : lectura.clase === "leida"
                    ? "Moverlo tocando el mapa"
                    : "Marcarlo tocando el mapa"}
              </Boton>
            </div>
          ) : (
            <div className="space-y-2">
              <h3 className={CLASE_DE_TITULO}>Por dónde va</h3>
              <p className="text-base text-texto">
                {borrador.puntos.length === 0
                  ? "Todavía sin puntos: tocá el mapa por donde va, de a uno."
                  : borrador.puntos.length < PUNTOS_MINIMOS_DE_UN_TRAZO
                    ? "1 punto: falta al menos uno más."
                    : `${borrador.puntos.length} puntos.`}
              </p>
              <Boton
                variante={anotar.marcando ? "principal" : "secundario"}
                anchoCompleto
                onClick={() => anotar.setMarcando(!anotar.marcando)}
              >
                {anotar.marcando ? "Listo, terminé de dibujar" : "Seguir dibujando"}
              </Boton>
              <div className="flex gap-2">
                <Boton
                  variante="secundario"
                  anchoCompleto
                  disabled={borrador.puntos.length === 0}
                  onClick={anotar.deshacerElUltimoPunto}
                >
                  Deshacer el último
                </Boton>
                {seleccionado ? (
                  <Boton variante="secundario" anchoCompleto onClick={anotar.volverADibujar}>
                    Volver a dibujar
                  </Boton>
                ) : null}
              </div>
            </div>
          )}

          <CamposDeAnotacion
            tipo={borrador.tipo}
            icono={borrador.tipo === "punto" ? borrador.icono : "cruce"}
            alCambiarIcono={anotar.setIcono}
            color={borrador.tipo === "trazo" ? borrador.color : COLOR_DE_TRAZO_POR_DEFECTO}
            alCambiarColor={anotar.setColor}
            comentario={anotar.comentario}
            alCambiarComentario={anotar.setComentario}
            foto={anotar.foto}
            fotoActual={anotar.quitarLaFoto ? null : (seleccionado?.fotoUrl ?? null)}
            alQuitarFotoActual={() => anotar.setQuitarLaFoto(true)}
            guardando={anotar.guardando}
          />

          {anotar.error ? (
            <p role="alert" className="rounded-xl bg-rojo-fondo px-3 py-2 text-base leading-6 text-rojo-texto">
              {anotar.error}
            </p>
          ) : null}

          {!anotar.haySenal ? (
            <p role="status" className="text-base leading-6 text-ambar-texto">
              Sin señal. Lo que cargaste queda acá; cuando vuelva la señal vas a poder guardar.
            </p>
          ) : null}

          <Boton type="submit" anchoCompleto disabled={!anotar.puedeGuardar || anotar.guardando}>
            {anotar.guardando ? "Guardando…" : `Guardar el ${nombre}`}
          </Boton>
          {seleccionado ? (
            <Boton variante="destructivo" anchoCompleto onClick={() => void alBorrar()}>
              {`Borrar el ${nombre}`}
            </Boton>
          ) : null}
        </fieldset>
      </form>
    </Tarjeta>
  );
}
