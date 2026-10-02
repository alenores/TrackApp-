"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { FormularioDeAnotacion } from "@/components/anotaciones/formulario-de-anotacion";
import { ListaDeAnotaciones } from "@/components/anotaciones/lista-de-anotaciones";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useAnotaciones, type LugarDeAnotaciones } from "@/hooks/use-anotaciones";
import { CORDOBA_COMPLETA } from "@/lib/mapas/general";
import type { Anotacion } from "@/types/database";

/**
 * **La pantalla de anotaciones**, la misma en Mapas (toda Córdoba) y en el
 * sector: el mapa, marcar un punto o dibujar un trazo, el formulario y la
 * lista. Lo único que cambia es qué parte del mapa se mira.
 *
 * Anotar es para lo que un mapa no puede mostrar: si el vado se cruza, si el
 * desvío existe, por dónde va la huella. Se arma con conexión, sentado; lo
 * marcado viaja después con el paquete y se mira en el cerro sin señal.
 *
 * Una anotación se abre tocándola en el mapa o en la lista.
 */

type Props = {
  lugar: LugarDeAnotaciones;
  /** Quién puede anotar acá. Sin señal, igual, nadie. */
  puedeAnotar: boolean;
  /** Lo que el lugar suma abajo de las acciones: traer de Google Earth, en el sector. */
  herramientas?: ReactNode;
  /** Lo que se está por traer de afuera, dibujado antes de agregarlo. */
  anotacionesPorAgregar?: Anotacion[];
  /** Mientras se trae algo de afuera, no se marca a mano. */
  trayendo?: boolean;
};

export function EditorDeAnotaciones({
  lugar,
  puedeAnotar,
  herramientas,
  anotacionesPorAgregar = [],
  trayendo = false,
}: Props) {
  const anotar = useAnotaciones(lugar);
  const formulario = useRef<HTMLDivElement>(null);
  const editable = puedeAnotar && anotar.haySenal;
  const deTodaCordoba = lugar.clase === "cordoba";
  const abiertoId = anotar.seleccionado?.id ?? null;
  const hayFormulario = anotar.borrador !== null;

  // Al abrir una anotación desde la lista, el formulario queda a la vista.
  useEffect(() => {
    if (abiertoId === null) return;
    const cuadro = window.requestAnimationFrame(() =>
      formulario.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
    );
    return () => window.cancelAnimationFrame(cuadro);
  }, [abiertoId]);

  if (anotar.estado === "abriendo") {
    return (
      <Tarjeta>
        <p role="status" className="text-base text-texto-suave">Abriendo las anotaciones…</p>
      </Tarjeta>
    );
  }

  if (anotar.estado === "sin_datos") {
    return (
      <Tarjeta franja="ambar">
        <p role="alert" className="text-base text-texto">
          {anotar.aviso ?? "No se pudieron cargar las anotaciones."} Recargá la pantalla para volver a intentar.
        </p>
      </Tarjeta>
    );
  }

  const encuadreDelLugar = lugar.clase === "sector" ? lugar.sector.rectangulo : CORDOBA_COMPLETA;
  const borrador = anotar.borrador;
  const queHacer = anotar.marcando
    ? borrador?.tipo === "trazo"
      ? "Tocá el mapa por donde va el trazo, de a un punto por vez."
      : "Tocá el mapa donde está el lugar."
    : editable
      ? "Tocá un punto del mapa para abrirlo. Con Satelital ves el terreno de verdad."
      : null;

  return (
    <div className="flex flex-col gap-3">
      {anotar.aviso ? (
        <Tarjeta franja="ambar">
          <p role="alert" className="text-base text-texto">
            La lista puede estar incompleta: {anotar.aviso}. Recargá para volver a intentar.
          </p>
        </Tarjeta>
      ) : null}

      <div className="space-y-2">
        <CargadorDeMapa
          enVivo
          principal
          alturaExtendida={deTodaCordoba}
          encuadre={anotar.enfoque ?? encuadreDelLugar}
          rectangulos={
            lugar.clase === "sector" ? [{ rectangulo: lugar.sector.rectangulo, clase: "sector" }] : undefined
          }
          anotaciones={[...anotar.enElMapa, ...anotacionesPorAgregar]}
          marcandoPunto={anotar.marcando}
          alMarcarPunto={anotar.alTocarElMapa}
          alTocarAnotacion={editable && !anotar.marcando && !trayendo ? anotar.abrir : undefined}
          mostrarFichaAnotacion={!editable}
        />
        {queHacer ? <p className="text-sm leading-6 text-texto-suave">{queHacer}</p> : null}
      </div>

      {!hayFormulario && anotar.mensaje ? (
        <Tarjeta franja="verde">
          <p role="status" className="text-base text-texto">{anotar.mensaje}</p>
        </Tarjeta>
      ) : null}
      {!hayFormulario && anotar.error ? (
        <Tarjeta franja="ambar">
          <p role="alert" className="text-base text-texto">{anotar.error}</p>
        </Tarjeta>
      ) : null}

      {hayFormulario ? (
        <div ref={formulario}>
          <FormularioDeAnotacion anotar={anotar} />
        </div>
      ) : editable && !trayendo ? (
        <div className="grid grid-cols-2 gap-2">
          <Boton anchoCompleto onClick={anotar.empezarUnPunto}>
            Marcar un punto
          </Boton>
          <Boton anchoCompleto variante="secundario" onClick={anotar.empezarUnTrazo}>
            Dibujar un trazo
          </Boton>
        </div>
      ) : null}

      {!hayFormulario && editable ? herramientas : null}

      {!anotar.haySenal && puedeAnotar ? (
        <Tarjeta>
          <p className="text-base leading-6 text-texto-suave">
            Sin señal. Las anotaciones se ven, pero para marcar o cambiar algo hace falta internet.
          </p>
        </Tarjeta>
      ) : null}

      <ListaDeAnotaciones
        anotaciones={anotar.anotaciones}
        zonas={anotar.zonas}
        sectores={anotar.sectores}
        deTodaCordoba={deTodaCordoba}
        alAbrir={editable && !trayendo ? anotar.abrir : undefined}
        abiertaId={abiertoId}
      />
    </div>
  );
}
