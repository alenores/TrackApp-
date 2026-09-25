"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Boton } from "@/components/ui/boton";
import { useDialogos } from "@/components/ui/dialogos";
import { ElegirAnotacionesDelMapa } from "@/components/navegacion/elegir-anotaciones-del-mapa";
import { FichaDeAnotacion } from "@/components/navegacion/ficha-de-anotacion";
import { ElegirQueAnotar, PanelDeAnotar } from "@/components/navegacion/panel-de-anotar";
import { useAnotacionesDelCerro } from "@/hooks/use-anotaciones-del-cerro";
import type { Gps } from "@/hooks/use-gps";
import { useMarcarAnotacion } from "@/hooks/use-marcar-anotacion";
import type { AnotacionEnPantalla } from "@/lib/anotaciones/en-pantalla";
import { comoSeLlamaElFiltro } from "@/lib/anotaciones/filtro";
import { anotarUnBorrado } from "@/lib/anotaciones/pendientes";
import { vibrarAlTocar } from "@/lib/vibracion";
import type { Anotacion } from "@/types/database";

/**
 * Las anotaciones en los mapas del cerro: navegar una ruta y el mapa libre.
 *
 * **Las dos pantallas hacen exactamente lo mismo**, así que vive acá una sola
 * vez: ver las anotaciones según las casillas, abrir la ficha, marcar una
 * nueva, cambiar o borrar las tuyas. Todo queda en el celular y sube solo
 * cuando haya señal, con la navegación cerrada.
 *
 * Devuelve lo que el mapa necesita y los pedazos de pantalla para que cada
 * una los ponga donde van.
 */

type Opciones = {
  /** Las anotaciones del paquete que corresponden a esta pantalla. */
  delPaquete: Anotacion[];
  gps: Gps;
  /** Encuadra el mapa donde estás. */
  centrarEnMi: () => void;
};

export type AnotacionesEnElMapa = {
  /** Lo que se dibuja: las que pasan las casillas y lo que se está marcando. */
  enElMapa: Anotacion[];
  marcandoPunto: boolean;
  alMarcarPunto: (lon: number, lat: number) => void;
  alTocarAnotacion: (anotacionId: number) => void;
  /** `true` mientras el panel de anotar ocupa la parte de abajo. */
  anotando: boolean;
  /** Los botones de «Anotar» y de qué anotaciones ver. */
  botones: ReactNode;
  /** El panel de anotar, para poner abajo cuando `anotando`. */
  panel: ReactNode;
  /** El aviso de «guardado», para poner arriba, adentro de la pantalla del mapa. */
  aviso: ReactNode;
  /** Las emergentes, para poner al final. */
  resto: ReactNode;
};

/** Cuánto queda a la vista el aviso de «guardado». Todo lo que aparece, se va. */
const SEGUNDOS_DEL_AVISO = 6;

export function useAnotacionesEnElMapa({ delPaquete, gps, centrarEnMi }: Opciones): AnotacionesEnElMapa {
  const { confirmar, avisar } = useDialogos();
  const cerro = useAnotacionesDelCerro(delPaquete);
  const marcado = useMarcarAnotacion(gps);

  const [tocadaId, setTocadaId] = useState<number | null>(null);
  const [eligiendoTipo, setEligiendoTipo] = useState(false);
  const [eligiendoFiltro, setEligiendoFiltro] = useState(false);
  const [guardadoHace, setGuardadoHace] = useState<number | null>(null);

  useEffect(() => {
    if (guardadoHace === null) return;
    const reloj = window.setTimeout(() => setGuardadoHace(null), SEGUNDOS_DEL_AVISO * 1000);
    return () => window.clearTimeout(reloj);
  }, [guardadoHace]);

  const tocada: AnotacionEnPantalla | null =
    tocadaId === null ? null : (cerro.todas.find((cada) => cada.id === tocadaId) ?? null);

  const enElMapa = useMemo(() => {
    if (!marcado.abierto) return cerro.visibles;
    const cambiando = marcado.borrador?.cambiando?.id;
    const sinLaQueSeCambia = cerro.visibles.filter((cada) => cada.id !== cambiando);
    return marcado.vistaPrevia ? [...sinLaQueSeCambia, marcado.vistaPrevia] : sinLaQueSeCambia;
  }, [cerro.visibles, marcado.abierto, marcado.borrador, marcado.vistaPrevia]);

  const alTocarAnotacion = useCallback((anotacionId: number) => {
    vibrarAlTocar();
    setTocadaId(anotacionId);
  }, []);

  const cerrarLaFicha = useCallback(() => setTocadaId(null), []);
  const cerrarElegirTipo = useCallback(() => setEligiendoTipo(false), []);
  const cerrarElegirFiltro = useCallback(() => setEligiendoFiltro(false), []);

  const empezar = useCallback(
    (tipo: "punto" | "trazo") => {
      setEligiendoTipo(false);
      marcado.empezar(tipo);
      // La pantalla de anotar abre siempre donde está el GPS.
      centrarEnMi();
    },
    [marcado, centrarEnMi],
  );

  const cambiar = useCallback(
    (anotacion: AnotacionEnPantalla) => {
      setTocadaId(null);
      marcado.cambiar(anotacion);
    },
    [marcado],
  );

  const borrar = useCallback(
    async (anotacion: AnotacionEnPantalla) => {
      const seguro = await confirmar({
        titulo: "¿Borrar esta anotación?",
        mensaje:
          anotacion.subida?.clase === "sin_subir"
            ? "Todavía no se había subido: se borra de este celular y nadie la va a ver."
            : "Deja de verse ya. Se borra para todos cuando tengas señal.",
        textoDeAceptar: "Borrar",
        destructivo: true,
      });
      if (!seguro) return;

      setTocadaId(null);
      try {
        await anotarUnBorrado({
          anotacionId: anotacion.id > 0 ? anotacion.id : null,
          codigoDeLaMarca: anotacion.codigoDeLaMarca,
        });
      } catch (causa) {
        await avisar({
          titulo: "No se pudo borrar",
          mensaje: `El celular no dejó guardar el borrado: ${
            causa instanceof Error && causa.message ? causa.message : "sin motivo"
          }. Probá de nuevo.`,
        });
      }
    },
    [confirmar, avisar],
  );

  // «Anotar» queda justo y el resto del ancho es para decir qué se ve: sin
  // eso, el texto quedaba cortado a la mitad.
  const botones = (
    <div className="grid grid-cols-[auto_1fr] gap-3">
      <Boton className="px-6 shadow-[var(--sombra-alta)]" onClick={() => setEligiendoTipo(true)}>
        Anotar
      </Boton>
      <Boton
        variante="secundario"
        className="min-w-0 px-3 shadow-[var(--sombra-alta)]"
        onClick={() => setEligiendoFiltro(true)}
      >
        <span className="flex min-w-0 flex-col leading-tight">
          <span>Anotaciones</span>
          <span className="truncate font-normal">{comoSeLlamaElFiltro(cerro.filtro)}</span>
        </span>
      </Boton>
    </div>
  );

  const panel = (
    <PanelDeAnotar
      marcado={marcado}
      gps={gps}
      alCentrarEnMi={centrarEnMi}
      alGuardar={() => setGuardadoHace(Date.now())}
    />
  );

  const aviso =
    guardadoHace !== null ? (
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-3">
        <p
          role="status"
          className="rounded-xl border border-borde-fuerte bg-superficie px-4 py-3 text-center text-lg text-texto shadow-[var(--sombra-alta)]"
        >
          Guardada en el celular. Se sube sola cuando tengas señal.
        </p>
      </div>
    ) : null;

  const resto = (
    <>

      <ElegirQueAnotar abierto={eligiendoTipo} alCerrar={cerrarElegirTipo} alElegir={empezar} />

      <ElegirAnotacionesDelMapa
        abierto={eligiendoFiltro}
        alCerrar={cerrarElegirFiltro}
        filtro={cerro.filtro}
        alCambiar={cerro.cambiarFiltro}
        cuantas={cerro.cuantas}
      />

      <FichaDeAnotacion
        anotacion={tocada}
        alCerrar={cerrarLaFicha}
        miPerfilId={cerro.miPerfilId}
        alCambiar={tocada && cerro.puedoCambiar(tocada) ? cambiar : undefined}
        alBorrar={tocada && cerro.puedoCambiar(tocada) ? (cada) => void borrar(cada) : undefined}
      />
    </>
  );

  return {
    enElMapa,
    marcandoPunto: marcado.marcandoEnElMapa,
    alMarcarPunto: marcado.alTocarElMapa,
    alTocarAnotacion,
    anotando: marcado.abierto,
    botones,
    panel,
    aviso,
    resto,
  };
}
