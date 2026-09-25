"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CamposDeAnotacion } from "@/components/anotaciones/campos-de-anotacion";
import { Boton } from "@/components/ui/boton";
import { Emergente, BotonDeEmergente } from "@/components/ui/emergente";
import { useDialogos } from "@/components/ui/dialogos";
import { useCerrarConAtras } from "@/hooks/use-cerrar-con-atras";
import { useFotoDelCelular } from "@/hooks/use-foto-del-celular";
import type { Gps } from "@/hooks/use-gps";
import type { Marcado, TipoDeMarca } from "@/hooks/use-marcar-anotacion";
import { COLOR_DE_TRAZO_POR_DEFECTO } from "@/lib/anotaciones/colores-de-trazo";

/**
 * Anotar desde el cerro: el panel de abajo, con el mapa a la vista arriba.
 *
 * **El mapa no se tapa**, porque es donde se marca: el punto se ve donde va a
 * quedar y el trazo se dibuja tocando. Todo lo que se toca está en la mitad de
 * abajo, a mano del pulgar.
 *
 * **El GPS se dice siempre.** Si anda, el punto va donde estás. Si no anda o
 * no da novedades, se dice acá mismo y el punto se marca tocando el mapa.
 *
 * **Nada sale a internet.** Lo marcado queda en el celular y sube solo cuando
 * haya señal, con la navegación cerrada.
 */

type ElegirProps = {
  abierto: boolean;
  alCerrar: () => void;
  alElegir: (tipo: TipoDeMarca) => void;
};

/** El primer paso: ¿un punto o un trazo? */
export function ElegirQueAnotar({ abierto, alCerrar, alElegir }: ElegirProps) {
  return (
    <Emergente
      abierto={abierto}
      alCerrar={alCerrar}
      titulo="¿Qué querés marcar?"
      acciones={
        <BotonDeEmergente variante="fantasma" paraNavegacion onClick={alCerrar}>
          Cancelar
        </BotonDeEmergente>
      }
    >
      <div className="space-y-3">
        <Boton anchoCompleto paraNavegacion className="min-h-20 flex-col" onClick={() => alElegir("punto")}>
          <span className="text-lg font-bold">Un punto</span>
          <span className="text-base font-normal">Un cruce, una fuente, un peligro</span>
        </Boton>
        <Boton
          variante="secundario"
          anchoCompleto
          paraNavegacion
          className="min-h-20 flex-col"
          onClick={() => alElegir("trazo")}
        >
          <span className="text-lg font-bold">Un trazo</span>
          <span className="text-base font-normal">Una huella o un paso que el mapa no tiene</span>
        </Boton>
      </div>
    </Emergente>
  );
}

type PanelProps = {
  marcado: Marcado;
  gps: Gps;
  /** Para volver a encuadrar el mapa donde estás. */
  alCentrarEnMi: () => void;
  /** Se llama después de guardar bien, para avisarlo en el mapa. */
  alGuardar: () => void;
};

function EstadoDelGps({ gps, gpsSirve }: { gps: Gps; gpsSirve: boolean }) {
  if (gpsSirve) {
    return (
      <p className="text-lg text-texto-suave">
        GPS andando{gps.precision !== null ? ` · ±${gps.precision} m` : ""}
      </p>
    );
  }

  const texto =
    gps.estado === "apagado" || gps.estado === "pidiendo"
      ? "El GPS está apagado: no se sabe dónde estás."
      : gps.posicionVieja
        ? `Hace ${gps.segundosSinNoticias} segundos que el GPS no da novedades: tu posición puede estar corrida.`
        : (gps.error ?? "El GPS no está dando tu posición.");

  return (
    <div className="space-y-2">
      <p role="alert" className="rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-2 text-lg leading-7 text-ambar-texto">
        {texto} Marcá el lugar tocando el mapa.
      </p>
      {gps.estado === "apagado" || gps.estado === "pidiendo" ? (
        <Boton
          variante="secundario"
          anchoCompleto
          paraNavegacion
          disabled={gps.estado === "pidiendo"}
          onClick={gps.prender}
        >
          {gps.estado === "pidiendo" ? "Prendiendo el GPS…" : "Prender el GPS"}
        </Boton>
      ) : null}
    </div>
  );
}

export function PanelDeAnotar({ marcado, gps, alCentrarEnMi, alGuardar }: PanelProps) {
  const { confirmar } = useDialogos();
  const { borrador } = marcado;
  const fotoActual = useFotoDelCelular(
    borrador?.cambiando && !borrador.quitarLaFoto ? borrador.cambiando.fotoChicaUrl : null,
  );

  /**
   * Si con el atrás dijiste que no querías tirar lo marcado, el panel sigue
   * abierto pero ya gastó su entrada del historial: cambiar este número la
   * vuelve a poner, así el próximo atrás también pregunta.
   */
  const [vueltaDelAtras, setVueltaDelAtras] = useState(0);

  // Pantalla mojada: tirar lo que se marcó pide confirmación.
  const cancelar = useCallback(
    async (desdeElAtras: boolean) => {
      if (marcado.hayAlgo) {
        const seguro = await confirmar({
          titulo: "¿Tirar lo que marcaste?",
          mensaje: "Se pierde lo que escribiste y marcaste en el mapa.",
          textoDeAceptar: "Tirar",
          destructivo: true,
        });
        if (!seguro) {
          if (desdeElAtras) setVueltaDelAtras((cada) => cada + 1);
          return;
        }
      }
      marcado.cerrar();
    },
    [confirmar, marcado],
  );

  // El atrás del celular cancela, con la misma confirmación. La función que
  // se engancha cambia solo cuando hay que volver a poner la entrada: si
  // cambiara en cada dibujado, el historial se tocaría en cada letra.
  const cancelarRef = useRef(cancelar);
  useEffect(() => {
    cancelarRef.current = cancelar;
  }, [cancelar]);
  const alVolver = useCallback(
    () => void cancelarRef.current(true),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- la vuelta es justamente para rearmarla
    [vueltaDelAtras],
  );
  useCerrarConAtras(marcado.abierto, alVolver);

  if (!borrador) return null;

  const esNuevo = borrador.cambiando === null;
  const titulo =
    borrador.tipo === "punto"
      ? esNuevo ? "Punto nuevo" : "Cambiar el punto"
      : esNuevo ? "Trazo nuevo" : "Cambiar el trazo";

  const guardar = async () => {
    if (await marcado.guardar()) alGuardar();
  };

  return (
    <section
      aria-label={titulo}
      className="pointer-events-auto max-h-[62vh] overflow-y-auto rounded-t-2xl border-t border-borde-fuerte bg-superficie px-4 pb-safe-4 pt-3 shadow-[var(--sombra-alta)]"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-texto">{titulo}</h2>
          <Boton variante="secundario" paraNavegacion className="shrink-0 px-3 text-base" onClick={alCentrarEnMi}>
            Ir a mí
          </Boton>
        </div>

        <EstadoDelGps gps={gps} gpsSirve={marcado.gpsSirve} />

        {borrador.tipo === "punto" ? (
          <div className="space-y-2 rounded-xl border border-borde-suave bg-fondo px-3 py-3">
            <p className="text-lg text-texto">
              {marcado.lugarDelPunto === null
                ? "Tocá el mapa donde está el lugar."
                : borrador.modo === "gps" && marcado.gpsSirve
                  ? "Se marca donde estás ahora."
                  : "Se marca donde tocaste el mapa. Tocá de nuevo para moverlo."}
            </p>
            {marcado.gpsSirve ? (
              borrador.modo === "gps" ? (
                <Boton variante="secundario" anchoCompleto paraNavegacion onClick={marcado.marcarAMano}>
                  Marcar a mano en el mapa
                </Boton>
              ) : (
                <Boton variante="secundario" anchoCompleto paraNavegacion onClick={marcado.usarElGps}>
                  Usar mi posición del GPS
                </Boton>
              )
            ) : null}
          </div>
        ) : (
          <div className="space-y-2 rounded-xl border border-borde-suave bg-fondo px-3 py-3">
            <p className="text-lg text-texto">
              {borrador.puntos.length === 0
                ? "Tocá el mapa por donde va, de a un punto por vez."
                : borrador.puntos.length === 1
                  ? "1 punto: falta al menos uno más."
                  : `${borrador.puntos.length} puntos. Seguí tocando o guardalo.`}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Boton
                variante="secundario"
                paraNavegacion
                disabled={!marcado.gpsSirve}
                onClick={marcado.sumarMiPosicion}
              >
                Sumar donde estoy
              </Boton>
              <Boton
                variante="secundario"
                paraNavegacion
                disabled={borrador.puntos.length === 0}
                onClick={marcado.deshacerElUltimoPunto}
              >
                Deshacer el último
              </Boton>
            </div>
          </div>
        )}

        <CamposDeAnotacion
          tipo={borrador.tipo}
          icono={borrador.icono}
          alCambiarIcono={marcado.cambiarIcono}
          color={borrador.color ?? COLOR_DE_TRAZO_POR_DEFECTO}
          alCambiarColor={marcado.cambiarColor}
          comentario={borrador.comentario}
          alCambiarComentario={marcado.cambiarComentario}
          foto={marcado.foto}
          fotoActual={fotoActual.paso === "esta" ? fotoActual.direccion : null}
          alQuitarFotoActual={marcado.quitarLaFotoActual}
          guardando={marcado.guardando}
          delCerro
        />

        {marcado.error ? (
          <p role="alert" className="rounded-xl bg-rojo-fondo px-3 py-2 text-lg leading-7 text-rojo-texto">
            {marcado.error}
          </p>
        ) : null}

        <div className="space-y-2">
          <Boton anchoCompleto paraNavegacion disabled={!marcado.puedeGuardar} onClick={() => void guardar()}>
            {marcado.guardando ? "Guardando…" : "Guardar en el celular"}
          </Boton>
          <Boton variante="fantasma" anchoCompleto paraNavegacion disabled={marcado.guardando} onClick={() => void cancelar(false)}>
            Cancelar
          </Boton>
        </div>
      </div>
    </section>
  );
}
