"use client";

import { useEffect, useRef, type FormEvent } from "react";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { CamposDeAnotacion } from "@/components/anotaciones/campos-de-anotacion";
import { BotonVolver } from "@/components/ui/boton-volver";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useDialogos } from "@/components/ui/dialogos";
import { usePuntos } from "@/hooks/use-puntos";
import { COLOR_DE_TRAZO_POR_DEFECTO } from "@/lib/anotaciones/colores-de-trazo";

export function PantallaDePuntos() {
  const puntos = usePuntos();
  const { confirmar } = useDialogos();
  const fotoLista = puntos.foto.estado === "vacio" || puntos.foto.estado === "lista";

  const formulario = useRef<HTMLFormElement>(null);
  useEffect(() => {
    // Espera a que el formulario deje de estar deshabilitado tras guardar.
    if (!puntos.mensaje || puntos.guardando) return;
    const entrada = formulario.current?.elements.namedItem("coordenada-del-punto");
    if (entrada instanceof HTMLElement) entrada.focus();
  }, [puntos.mensaje, puntos.guardando]);

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    await puntos.guardar();
  }

  async function confirmarBorrado() {
    if (await confirmar({
      titulo: "¿Borrar este punto?",
      mensaje: "Deja de aparecer en los mapas de todos. Su foto también deja de mostrarse.",
      textoDeAceptar: "Borrar", destructivo: true,
    })) await puntos.borrar();
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3">
      <div className="flex items-center gap-3">
        <BotonVolver destinoSiNoHayVuelta="/zonas" etiqueta="Volver a Zonas" />
        <h1 className="text-2xl font-bold uppercase text-texto">Puntos</h1>
      </div>
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
          <Tarjeta className="space-y-2">
            <CargadorDeMapa enVivo principal encuadre={puntos.encuadre}
              anotaciones={puntos.enElMapa} alTocarAnotacion={puntos.abrir} />
            <p className="text-base text-texto-suave">
              {puntos.puntos.length === 0
                ? "Todavía no hay puntos. Pegá una coordenada para cargar el primero."
                : "Tocá un punto del mapa para editarlo o borrarlo."}
            </p>
          </Tarjeta>
          {puntos.mensaje ? <Tarjeta><p role="status" className="text-base text-texto">{puntos.mensaje}</p></Tarjeta> : null}
          {puntos.error ? <Tarjeta franja="ambar"><p role="alert" className="text-base text-rojo-texto">{puntos.error}</p></Tarjeta> : null}
          <Tarjeta className="space-y-3">
            <h2 className="text-lg font-semibold text-texto">{puntos.seleccionado ? "Editar el punto" : "Punto nuevo"}</h2>
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
        </>
      )}
    </div>
  );
}
