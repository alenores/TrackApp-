"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CamposDeAnotacion } from "@/components/anotaciones/campos-de-anotacion";
import { Boton } from "@/components/ui/boton";
import { BotonRedondo, ICONOS_DEL_CERRO } from "@/components/ui/boton-redondo";
import { Emergente, BotonDeEmergente } from "@/components/ui/emergente";
import { SALIR_SIN_GUARDAR, useDialogos } from "@/components/ui/dialogos";
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
 * abajo, a mano del pulgar. El formulario es más alto que el celular: se
 * desplaza adentro del panel, hasta Guardar, y no se sale de la pantalla.
 *
 * Arriba a la derecha van centrar en el GPS y la X. El botón de atrás del
 * celular cierra esta pantalla. Al abrirse, el mapa que queda arriba se
 * centra donde estás.
 *
 * **Un punto arranca en el GPS** y se mueve si se toca el mapa. **Un trazo
 * no:** se aprieta «Comenzar a dibujar», el panel se achica y los puntos se
 * cargan a mano. Ahí quedan a la vista deshacer, cancelar y finalizar.
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
        <BotonDeEmergente variante="fantasma" onClick={alCerrar}>
          Cancelar
        </BotonDeEmergente>
      }
    >
      <div className="space-y-3">
        <Boton anchoCompleto className="flex-col" onClick={() => alElegir("punto")}>
          <span className="font-bold">Un punto</span>
          <span className="text-xs font-normal">Un cruce, una fuente, un peligro</span>
        </Boton>
        <Boton
          variante="secundario"
          anchoCompleto
          className="flex-col"
          onClick={() => alElegir("trazo")}
        >
          <span className="font-bold">Un trazo</span>
          <span className="text-xs font-normal">Una huella o un paso que el mapa no tiene</span>
        </Boton>
      </div>
    </Emergente>
  );
}

type PanelProps = {
  marcado: Marcado;
  gps: Gps;
  /**
   * Centra el mapa que queda arriba del panel. Recibe el alto del panel
   * para que el GPS no quede tapado.
   */
  alCentrarEnMi: (altoDelPanel: number) => void;
  /** El panel cambió de alto: el mapa deja libre esa franja, sin viajar al GPS. */
  alMedirElPanel: (altoDelPanel: number) => void;
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
      ? "El GPS todavía está buscando tu posición."
      : gps.posicionVieja
        ? `Hace ${gps.segundosSinNoticias} segundos que el GPS no da novedades: tu posición puede estar corrida.`
        : (gps.error ?? "El GPS no está dando tu posición.");

  return (
    <div className="space-y-2">
      <p role="alert" className="rounded-xl border border-ambar-borde bg-ambar-fondo px-3 py-2 text-lg leading-7 text-ambar-texto">
        {texto} Marcá el lugar tocando el mapa.
      </p>
    </div>
  );
}

export function PanelDeAnotar({ marcado, gps, alCentrarEnMi, alMedirElPanel, alGuardar }: PanelProps) {
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

  const seccionRef = useRef<HTMLElement>(null);
  const yaCentroAlAbrir = useRef(false);
  const hayPosicion = gps.posicion !== null;

  // Al abrirse, el mapa que queda arriba se centra donde está el GPS.
  // Si el GPS todavía no respondió, se espera a la primera posición.
  // Si después el panel se achica o vuelve a crecer, solo se acomoda el
  // margen: no se lleva el mapa de vuelta al GPS.
  useLayoutEffect(() => {
    if (!marcado.abierto) {
      yaCentroAlAbrir.current = false;
      return;
    }
    const alto = seccionRef.current?.offsetHeight ?? 0;
    if (alto <= 0) return;
    if (!yaCentroAlAbrir.current) {
      if (!hayPosicion) return;
      yaCentroAlAbrir.current = true;
      alCentrarEnMi(alto);
      return;
    }
    alMedirElPanel(alto);
  }, [marcado.abierto, marcado.dibujando, hayPosicion, alCentrarEnMi, alMedirElPanel]);

  // Pantalla mojada: salir sin guardar pide confirmación.
  const cancelar = useCallback(
    async (desdeElAtras: boolean) => {
      if (marcado.guardando) return;
      if (marcado.hayAlgo) {
        const seguro = await confirmar(SALIR_SIN_GUARDAR);
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

  const centrar = () => {
    const alto = seccionRef.current?.offsetHeight ?? 0;
    if (alto > 0) alCentrarEnMi(alto);
  };

  const encabezado = (
    <div className="flex items-center gap-2">
      <h2 className="min-w-0 flex-1 truncate text-xl font-bold text-texto">{titulo}</h2>
      <BotonRedondo
        etiqueta="Centrar en mi ubicación"
        disabled={gps.posicion === null || marcado.guardando}
        onClick={centrar}
      >
        {ICONOS_DEL_CERRO.centrar}
      </BotonRedondo>
      <BotonRedondo etiqueta="Cerrar" disabled={marcado.guardando} onClick={() => void cancelar(false)}>
        {ICONOS_DEL_CERRO.salir}
      </BotonRedondo>
    </div>
  );

  return (
    <section
      ref={seccionRef}
      aria-label={titulo}
      className="pointer-events-auto max-h-[min(62dvh,calc(100dvh-env(safe-area-inset-top)))] touch-pan-y overflow-y-auto overscroll-contain rounded-t-2xl border-t border-borde-fuerte bg-superficie px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 shadow-[var(--sombra-alta)]"
    >
      {borrador.tipo === "trazo" && borrador.dibujando ? (
        <div className="space-y-3">
          {encabezado}
          {!marcado.gpsSirve ? <EstadoDelGps gps={gps} gpsSirve={false} /> : null}
          <p className="text-lg text-texto">
            {borrador.puntos.length === 0
              ? "Tocá el mapa por donde va. El primer punto lo ponés vos."
              : borrador.puntos.length === 1
                ? "1 punto: falta al menos uno más."
                : `${borrador.puntos.length} puntos. Tocá el mapa para sumar otro.`}
          </p>
          {marcado.error ? (
            <p role="alert" className="rounded-xl bg-rojo-fondo px-3 py-2 text-lg leading-7 text-rojo-texto">
              {marcado.error}
            </p>
          ) : null}
          <div className="grid grid-cols-3 gap-2">
            <Boton
              variante="secundario"
              className="w-full px-2"
              disabled={borrador.puntos.length === 0 || marcado.guardando}
              onClick={marcado.deshacerElUltimoPunto}
            >
              Deshacer
            </Boton>
            <Boton variante="fantasma" className="w-full px-2" disabled={marcado.guardando} onClick={() => void cancelar(false)}>
              Cancelar
            </Boton>
            <Boton className="w-full px-2" disabled={marcado.guardando} onClick={marcado.finalizarDibujo}>
              Finalizar
            </Boton>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {encabezado}

          <EstadoDelGps gps={gps} gpsSirve={marcado.gpsSirve} />

          {borrador.tipo === "punto" ? (
            <div className="space-y-2 rounded-xl border border-borde-suave bg-fondo px-3 py-3">
              <p className="text-lg text-texto">
                {marcado.lugarDelPunto === null
                  ? "Cuando el GPS te ubique, el punto queda ahí. Si tocás el mapa, lo movés a ese lugar."
                  : borrador.modo === "gps" && marcado.gpsSirve
                    ? "El punto queda donde estás. Si tocás el mapa, lo movés a ese lugar."
                    : "El punto queda donde tocaste el mapa. Tocá de nuevo para moverlo."}
              </p>
              {marcado.gpsSirve && borrador.modo === "a_mano" ? (
                <Boton variante="secundario" anchoCompleto onClick={marcado.usarElGps}>
                  Usar donde estoy
                </Boton>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-lg text-texto">
                {borrador.puntos.length === 0
                  ? "El trazo no arranca donde estás: lo marcás vos. Apretá comenzar a dibujar y tocá el mapa por donde va."
                  : borrador.puntos.length === 1
                    ? "1 punto: falta al menos uno más para poder guardarlo."
                    : `${borrador.puntos.length} puntos. Podés seguir dibujando o guardarlo.`}
              </p>
              <Boton anchoCompleto disabled={marcado.guardando} onClick={marcado.comenzarADibujar}>
                {borrador.puntos.length === 0 ? "Comenzar a dibujar" : "Seguir dibujando"}
              </Boton>
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
            <Boton anchoCompleto disabled={!marcado.puedeGuardar} onClick={() => void guardar()}>
              {marcado.guardando ? "Guardando…" : "Guardar en el celular"}
            </Boton>
            <Boton variante="fantasma" anchoCompleto disabled={marcado.guardando} onClick={() => void cancelar(false)}>
              Cancelar
            </Boton>
          </div>
        </div>
      )}
    </section>
  );
}
