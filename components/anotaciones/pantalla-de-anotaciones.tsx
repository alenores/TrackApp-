"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  borrarAnotacion,
  crearAnotacion,
  editarAnotacion,
} from "@/app/actions/territorio";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { BotonVolver } from "@/components/ui/boton-volver";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { AreaDeTexto } from "@/components/ui/area-de-texto";
import { useDialogos } from "@/components/ui/dialogos";
import { SelectorDeFoto } from "@/components/fotos/selector-de-foto";
import { FORMAS_DE_RECORTE } from "@/components/fotos/recorte-de-foto";
import { useFoto } from "@/hooks/use-foto";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { COMO_SE_LLAMA } from "@/lib/anotaciones/iconos";
import { ICONOS_PUNTO, type Anotacion, type IconoPunto } from "@/types/database";

/**
 * Las anotaciones de un sector: marcar un punto, escribirle algo y sumarle una
 * foto.
 *
 * **Para lo que un mapa no puede mostrar.** Si el vado se cruza, si el desvío
 * existe, cómo es el cruce de verdad. El mapa dice dónde; la foto dice cómo.
 *
 * Se arma en la computadora, con conexión, mirando el terreno de verdad. Lo
 * marcado viaja después con el paquete y se mira en el cerro sin señal.
 */

type Props = {
  zonaId: number;
  sectorId: number;
};

type EnEdicion = {
  id: number | null;
  icono: IconoPunto;
  comentario: string;
  lon: number;
  lat: number;
  fotoActual: string | null;
};

export function PantallaDeAnotaciones({ zonaId, sectorId }: Props) {
  const router = useRouter();
  const { paquete, estado } = useDatosDeLaApp();
  const { confirmar, avisar } = useDialogos();
  const foto = useFoto("anotacion", FORMAS_DE_RECORTE.anotacion);

  const [editando, setEditando] = useState<EnEdicion | null>(null);
  const [marcando, setMarcando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quitarLaFoto, setQuitarLaFoto] = useState(false);

  const sector = paquete?.sectores.find((cada) => cada.id === sectorId) ?? null;
  const anotaciones = (paquete?.anotaciones ?? []).filter(
    (cada) => cada.sectorId === sectorId,
  );

  if (estado === "abriendo") {
    return (
      <Tarjeta className="py-8 text-center text-base text-texto-suave">
        Abriendo el sector…
      </Tarjeta>
    );
  }

  if (!sector) {
    return (
      <Tarjeta franja="ambar" className="space-y-2">
        <p className="text-base font-medium text-texto">
          Este sector no está en el celular.
        </p>
        <p className="text-sm leading-6 text-texto-suave">
          Conectate una vez y vuelve a aparecer.
        </p>
      </Tarjeta>
    );
  }

  const empezarUnoNuevo = () => {
    setEditando(null);
    setError(null);
    setQuitarLaFoto(false);
    foto.quitar();
    setMarcando(true);
  };

  const abrirParaEditar = (anotacion: Anotacion) => {
    if (anotacion.geometria.type !== "Point") return;
    const [lon, lat] = anotacion.geometria.coordinates;

    setEditando({
      id: anotacion.id,
      icono: anotacion.icono ?? "cruce",
      comentario: anotacion.comentario ?? "",
      lon,
      lat,
      fotoActual: anotacion.fotoUrl,
    });
    setError(null);
    setQuitarLaFoto(false);
    foto.quitar();
    setMarcando(false);
  };

  const alMarcarPunto = (lon: number, lat: number) => {
    setEditando((anterior) =>
      anterior
        ? { ...anterior, lon, lat }
        : { id: null, icono: "cruce", comentario: "", lon, lat, fotoActual: null },
    );
    setMarcando(false);
  };

  const alGuardar = async () => {
    if (!editando) return;

    setGuardando(true);
    setError(null);

    const datos = {
      sectorId,
      tipo: "punto" as const,
      icono: editando.icono,
      color: null,
      comentario: editando.comentario.trim() || null,
      geometria: {
        type: "Point" as const,
        coordinates: [editando.lon, editando.lat],
      },
      foto: foto.archivo,
      quitarLaFoto,
    };

    const resultado = editando.id
      ? await editarAnotacion(editando.id, datos)
      : await crearAnotacion(datos);

    setGuardando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    setEditando(null);
    foto.quitar();
    setQuitarLaFoto(false);
    router.refresh();
  };

  const alBorrar = async (anotacion: Anotacion) => {
    const seguro = await confirmar({
      titulo: "¿Borrar esta anotación?",
      mensaje: "Se va también su foto. Si te arrepentís, se puede recuperar.",
      textoDeAceptar: "Borrar",
      destructivo: true,
    });
    if (!seguro) return;

    const resultado = await borrarAnotacion(anotacion.id);
    if (!resultado.ok) {
      await avisar({ titulo: "No se pudo borrar", mensaje: resultado.error });
      return;
    }
    if (editando?.id === anotacion.id) setEditando(null);
    router.refresh();
  };

  const puntosDibujados = anotaciones.filter(
    (cada) => cada.geometria.type === "Point",
  );

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:items-start">
      <div className="space-y-3">
        <Tarjeta className="space-y-2">
          <div className="flex items-start gap-2">
            <BotonVolver
              destinoSiNoHayVuelta={`/zonas/${zonaId}`}
              etiqueta="Volver a la zona"
            />
            <h1 className="min-w-0 flex-1 break-words pt-3 text-xl font-semibold text-texto">
              Anotaciones de {sector.nombre}
            </h1>
          </div>
          <p className="text-sm leading-6 text-texto-suave">
            Marcá los lugares que hay que ver con los propios ojos: un vado, un
            cruce dudoso, un refugio. La foto muestra lo que el mapa no puede.
          </p>
        </Tarjeta>

        {editando ? (
          <Tarjeta className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
              {editando.id ? "Editar la anotación" : "Anotación nueva"}
            </h2>

            <div>
              <p className="mb-1.5 text-sm text-texto-suave">Qué es</p>
              <div className="flex flex-wrap gap-2">
                {ICONOS_PUNTO.map((cual) => (
                  <button
                    key={cual}
                    type="button"
                    onClick={() =>
                      setEditando({ ...editando, icono: cual })
                    }
                    aria-pressed={editando.icono === cual}
                    className={[
                      "min-h-14 rounded-xl border px-4 text-base font-semibold transition-colors",
                      editando.icono === cual
                        ? "border-acento-borde bg-acento text-acento-texto"
                        : "border-borde bg-superficie-alta text-texto hover:border-borde-fuerte",
                    ].join(" ")}
                  >
                    {COMO_SE_LLAMA[cual]}
                  </button>
                ))}
              </div>
            </div>

            <AreaDeTexto
              label="Qué hay que saber"
              id="comentario-de-la-anotacion"
              rows={3}
              value={editando.comentario}
              onChange={(evento) =>
                setEditando({ ...editando, comentario: evento.target.value })
              }
              placeholder="Por acá se cruza el arroyo. Por la izquierda no se puede."
            />

            <SelectorDeFoto
              foto={foto}
              etiqueta="Agregar una foto del lugar"
              deshabilitado={guardando}
              fotoActual={quitarLaFoto ? null : editando.fotoActual}
            />

            {editando.fotoActual && !quitarLaFoto && foto.estado === "vacio" ? (
              <Boton
                variante="destructivo"
                anchoCompleto
                disabled={guardando}
                onClick={() => setQuitarLaFoto(true)}
              >
                Quitar la foto
              </Boton>
            ) : null}

            <div className="rounded-xl border border-borde-suave bg-fondo px-3 py-2">
              <p className="text-sm text-texto-suave">Dónde está</p>
              <p className="text-base font-semibold tabular-nums text-texto">
                {editando.lat.toFixed(5)}, {editando.lon.toFixed(5)}
              </p>
            </div>

            <Boton
              variante={marcando ? "principal" : "secundario"}
              anchoCompleto
              onClick={() => setMarcando(!marcando)}
            >
              {marcando ? "Tocá el mapa…" : "Mover el punto"}
            </Boton>

            {error ? (
              <p
                role="alert"
                className="rounded-xl bg-rojo-fondo px-3 py-2 text-sm leading-6 text-rojo-texto"
              >
                {error}
              </p>
            ) : null}

            <Boton
              anchoCompleto
              paraNavegacion
              disabled={guardando}
              onClick={() => void alGuardar()}
            >
              {guardando ? "Guardando…" : "Guardar la anotación"}
            </Boton>

            <Boton
              variante="fantasma"
              anchoCompleto
              disabled={guardando}
              onClick={() => {
                setEditando(null);
                setMarcando(false);
                foto.quitar();
              }}
            >
              Cancelar
            </Boton>
          </Tarjeta>
        ) : (
          <Boton
            anchoCompleto
            paraNavegacion
            variante={marcando ? "principal" : "principal"}
            onClick={empezarUnoNuevo}
          >
            {marcando ? "Tocá el mapa para marcar el punto" : "Marcar un lugar"}
          </Boton>
        )}

        <div className="space-y-2">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
            {puntosDibujados.length === 0
              ? "Anotaciones"
              : `Anotaciones (${puntosDibujados.length})`}
          </h2>

          {puntosDibujados.length === 0 ? (
            <Tarjeta>
              <p className="text-sm leading-6 text-texto-suave">
                Este sector todavía no tiene anotaciones.
              </p>
            </Tarjeta>
          ) : (
            puntosDibujados.map((anotacion) => (
              <Tarjeta key={anotacion.id} tono="alta" className="space-y-2">
                <div className="flex items-start gap-3">
                  {anotacion.fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- la foto viene del depósito y ya está achicada por el módulo de fotos.
                    <img
                      src={anotacion.fotoUrl}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-texto">
                      {COMO_SE_LLAMA[anotacion.icono ?? "cruce"]}
                    </p>
                    {anotacion.comentario ? (
                      <p className="mt-1 text-sm leading-6 text-texto-suave">
                        {anotacion.comentario}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Boton
                    variante="secundario"
                    onClick={() => abrirParaEditar(anotacion)}
                  >
                    Editar
                  </Boton>
                  <Boton
                    variante="destructivo"
                    onClick={() => void alBorrar(anotacion)}
                  >
                    Borrar
                  </Boton>
                </div>
              </Tarjeta>
            ))
          )}
        </div>
      </div>

      <Tarjeta className="space-y-2 lg:sticky lg:top-0">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
          Dónde queda
        </h2>
        <CargadorDeMapa
          enVivo
          grande
          encuadre={sector.rectangulo}
          rectangulos={[{ rectangulo: sector.rectangulo, clase: "sector" }]}
          anotaciones={
            editando && editando.id === null
              ? [
                  ...anotaciones,
                  {
                    id: -1,
                    sectorId,
                    perfilId: "",
                    tipo: "punto" as const,
                    icono: editando.icono,
                    color: null,
                    comentario: editando.comentario,
                    fotoUrl: null,
                    geometria: {
                      type: "Point" as const,
                      coordinates: [editando.lon, editando.lat],
                    },
                    creadoEn: "",
                    actualizadoEn: "",
                  },
                ]
              : anotaciones
          }
          marcandoPunto={marcando}
          alMarcarPunto={alMarcarPunto}
        />
        <p className="text-sm leading-6 text-texto-suave">
          {marcando
            ? "Tocá el mapa donde está el lugar que querés marcar."
            : "Cambiá a Foto para ver el terreno de verdad antes de marcar."}
        </p>
      </Tarjeta>

    </div>
  );
}
