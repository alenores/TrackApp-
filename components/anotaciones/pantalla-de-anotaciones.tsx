"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  borrarAnotacion,
  crearAnotacion,
  crearAnotacionesEnTanda,
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
import {
  FORMATOS_DE_GOOGLE_EARTH,
  leerArchivoDeGoogleEarth,
} from "@/lib/anotaciones/archivo-de-google-earth";
import {
  anotacionesDeGoogleEarth,
  anotacionesDeOsm,
  type Importacion,
  resumenDeImportacion,
  type RespuestaDeOsm,
} from "@/lib/anotaciones/importar";
import {
  claveDelColor,
  COLOR_DE_TRAZO_POR_DEFECTO,
  COLORES_DE_TRAZO,
  type ColorDeTrazo,
  nombreDelColor,
  TRAZO,
} from "@/lib/anotaciones/colores-de-trazo";
import { ICONOS_PUNTO, type Anotacion, type IconoPunto } from "@/types/database";

/**
 * Las anotaciones de un sector: marcar un punto o dibujar un trazo, escribirle
 * algo y sumarle una foto.
 *
 * **Para lo que un mapa no puede mostrar.** Si el vado se cruza, si el desvío
 * existe, cómo es el cruce de verdad, por dónde va la huella que el mapa no
 * tiene. El mapa dice dónde; la foto dice cómo; el trazo dice por dónde.
 *
 * **El trazo se dibuja de a toques**, un punto por toque, sin arrastrar nada:
 * es lo que funciona con el mouse y también con un dedo. Se puede deshacer el
 * último toque. Se arma en la computadora, con conexión, mirando el terreno de
 * verdad. Lo marcado viaja después con el paquete y se mira en el cerro sin
 * señal.
 *
 * **También se traen de afuera**: de un archivo de Google Earth, o las
 * tranqueras y alambrados de OpenStreetMap. Siempre con vista previa antes de
 * guardar: se dice qué entra, qué queda afuera del sector y qué ya estaba.
 */

type Props = {
  zonaId: number;
  sectorId: number;
};

type PuntoEnEdicion = {
  tipo: "punto";
  id: number | null;
  icono: IconoPunto;
  comentario: string;
  lon: number;
  lat: number;
  fotoActual: string | null;
};

type TrazoEnEdicion = {
  tipo: "trazo";
  id: number | null;
  color: ColorDeTrazo;
  comentario: string;
  puntos: [number, number][];
  fotoActual: string | null;
};

type EnEdicion = PuntoEnEdicion | TrazoEnEdicion;

type Trayendo = {
  deDonde: "Google Earth" | "OpenStreetMap";
  importacion: Importacion;
};

/** Con menos que esto no hay línea: lo exige también la base. */
const PUNTOS_MINIMOS_DE_UN_TRAZO = 2;

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

  const [trayendo, setTrayendo] = useState<Trayendo | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [errorAlTraer, setErrorAlTraer] = useState<string | null>(null);
  const entradaDeGoogleEarth = useRef<HTMLInputElement>(null);

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

  const limpiarElFormulario = () => {
    setError(null);
    setQuitarLaFoto(false);
    foto.quitar();
  };

  const empezarUnPunto = () => {
    setEditando(null);
    limpiarElFormulario();
    setMarcando(true);
  };

  const empezarUnTrazo = () => {
    setEditando({
      tipo: "trazo",
      id: null,
      color: COLOR_DE_TRAZO_POR_DEFECTO,
      comentario: "",
      puntos: [],
      fotoActual: null,
    });
    limpiarElFormulario();
    setMarcando(true);
  };

  const abrirParaEditar = (anotacion: Anotacion) => {
    if (anotacion.geometria.type === "Point") {
      const [lon, lat] = anotacion.geometria.coordinates;
      setEditando({
        tipo: "punto",
        id: anotacion.id,
        icono: anotacion.icono ?? "cruce",
        comentario: anotacion.comentario ?? "",
        lon,
        lat,
        fotoActual: anotacion.fotoUrl,
      });
    } else {
      setEditando({
        tipo: "trazo",
        id: anotacion.id,
        color: claveDelColor(anotacion.color),
        comentario: anotacion.comentario ?? "",
        puntos: anotacion.geometria.coordinates.map(
          ([lon, lat]) => [lon, lat] as [number, number],
        ),
        fotoActual: anotacion.fotoUrl,
      });
    }
    limpiarElFormulario();
    setMarcando(false);
  };

  const alMarcarPunto = (lon: number, lat: number) => {
    if (editando?.tipo === "trazo") {
      // Un toque más en la línea; se sigue marcando hasta que el usuario diga.
      setEditando({ ...editando, puntos: [...editando.puntos, [lon, lat]] });
      return;
    }

    setEditando((anterior) =>
      anterior?.tipo === "punto"
        ? { ...anterior, lon, lat }
        : {
            tipo: "punto",
            id: null,
            icono: "cruce",
            comentario: "",
            lon,
            lat,
            fotoActual: null,
          },
    );
    setMarcando(false);
  };

  const deshacerElUltimoPunto = () => {
    if (editando?.tipo !== "trazo") return;
    setEditando({ ...editando, puntos: editando.puntos.slice(0, -1) });
  };

  const volverADibujar = () => {
    if (editando?.tipo !== "trazo") return;
    setEditando({ ...editando, puntos: [] });
    setMarcando(true);
  };

  const alGuardar = async () => {
    if (!editando) return;

    setGuardando(true);
    setError(null);

    const comunes = {
      sectorId,
      comentario: editando.comentario.trim() || null,
      foto: foto.archivo,
      quitarLaFoto,
    };

    const datos =
      editando.tipo === "punto"
        ? {
            ...comunes,
            tipo: "punto" as const,
            icono: editando.icono,
            color: null,
            geometria: {
              type: "Point" as const,
              coordinates: [editando.lon, editando.lat],
            },
          }
        : {
            ...comunes,
            tipo: "trazo" as const,
            icono: null,
            color: TRAZO[editando.color].color,
            geometria: {
              type: "LineString" as const,
              coordinates: editando.puntos,
            },
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
    setMarcando(false);
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

  const cancelar = () => {
    setEditando(null);
    setMarcando(false);
    foto.quitar();
  };

  const alElegirArchivoDeGoogleEarth = async (archivo: File | null) => {
    if (!archivo) return;
    setErrorAlTraer(null);
    setBuscando(true);
    const lectura = await leerArchivoDeGoogleEarth(archivo);
    setBuscando(false);
    if (entradaDeGoogleEarth.current) entradaDeGoogleEarth.current.value = "";
    if (!lectura.ok) {
      setErrorAlTraer(lectura.error);
      return;
    }
    setTrayendo({
      deDonde: "Google Earth",
      importacion: anotacionesDeGoogleEarth(lectura.figuras, sector.rectangulo, anotaciones),
    });
  };

  const traerDeOpenStreetMap = async () => {
    setErrorAlTraer(null);
    setBuscando(true);
    const { latNorte, latSur, lonEste, lonOeste } = sector.rectangulo;
    const direccion = `/api/osm/barreras?norte=${latNorte}&sur=${latSur}&este=${lonEste}&oeste=${lonOeste}`;
    try {
      const respuesta = await fetch(direccion);
      const cuerpo = (await respuesta.json()) as RespuestaDeOsm & { error?: string };
      if (!respuesta.ok) {
        setErrorAlTraer(cuerpo.error ?? `OpenStreetMap contestó ${respuesta.status}.`);
        return;
      }
      setTrayendo({
        deDonde: "OpenStreetMap",
        importacion: anotacionesDeOsm(cuerpo, sector.rectangulo, anotaciones),
      });
    } catch (error) {
      setErrorAlTraer(
        `No se pudo preguntar a OpenStreetMap: ${
          error instanceof Error && error.message ? error.message : "sin conexión"
        }`,
      );
    } finally {
      setBuscando(false);
    }
  };

  const agregarLoTraido = async () => {
    if (!trayendo) return;
    setGuardando(true);
    setErrorAlTraer(null);
    const resultado = await crearAnotacionesEnTanda(sectorId, trayendo.importacion.dentro);
    setGuardando(false);
    if (!resultado.ok) {
      setErrorAlTraer(resultado.error);
      return;
    }
    setTrayendo(null);
    router.refresh();
  };

  const trazoEnCurso = editando?.tipo === "trazo" ? editando : null;
  const faltanPuntos =
    trazoEnCurso !== null && trazoEnCurso.puntos.length < PUNTOS_MINIMOS_DE_UN_TRAZO;

  /**
   * Lo que se está dibujando, para que el mapa lo muestre antes de guardarlo.
   *
   * Un trazo con un solo toque todavía no es una línea: se muestra como punto,
   * para que se vea dónde arrancó.
   */
  const vistaPrevia = (): Anotacion | null => {
    if (!editando) return null;
    const base = {
      id: -1,
      sectorId,
      perfilId: "",
      comentario: editando.comentario,
      fotoUrl: null,
      creadoEn: "",
      actualizadoEn: "",
    };

    if (editando.tipo === "punto") {
      if (editando.id !== null) return null;
      return {
        ...base,
        tipo: "punto",
        icono: editando.icono,
        color: null,
        geometria: { type: "Point", coordinates: [editando.lon, editando.lat] },
      };
    }

    if (editando.puntos.length === 0) return null;
    const color = TRAZO[editando.color].color;
    if (editando.puntos.length === 1) {
      return {
        ...base,
        tipo: "punto",
        icono: null,
        color,
        geometria: { type: "Point", coordinates: editando.puntos[0] },
      };
    }
    return {
      ...base,
      tipo: "trazo",
      icono: null,
      color,
      geometria: { type: "LineString", coordinates: editando.puntos },
    };
  };

  const enElMapa = (() => {
    if (trayendo) {
      // Lo que se va a agregar, dibujado antes de guardarlo. Los números
      // negativos son de mentira: no existen en la base todavía.
      return [
        ...anotaciones,
        ...trayendo.importacion.dentro.map((cada, indice) => ({
          ...cada,
          id: -(indice + 1),
          sectorId,
          perfilId: "",
          fotoUrl: null,
          creadoEn: "",
          actualizadoEn: "",
        })),
      ];
    }
    const previa = vistaPrevia();
    if (!previa) return anotaciones;
    // Si se está redibujando un trazo guardado, se muestra el nuevo en su lugar.
    const sinElQueSeEdita = anotaciones.filter((cada) => cada.id !== editando?.id);
    return [...sinElQueSeEdita, previa];
  })();

  const queHacerEnElMapa = marcando
    ? trazoEnCurso
      ? "Tocá el mapa por donde va el trazo, de a un punto por vez."
      : "Tocá el mapa donde está el lugar que querés marcar."
    : "Cambiá a Foto para ver el terreno de verdad antes de marcar.";

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
            cruce dudoso, un refugio. Dibujá lo que el mapa no muestra: una
            huella, un alambrado, un desvío. La foto muestra lo que el mapa no
            puede.
          </p>
        </Tarjeta>

        {editando ? (
          <Tarjeta className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
              {editando.id
                ? editando.tipo === "punto"
                  ? "Editar el punto"
                  : "Editar el trazo"
                : editando.tipo === "punto"
                  ? "Punto nuevo"
                  : "Trazo nuevo"}
            </h2>

            {editando.tipo === "punto" ? (
              <div>
                <p className="mb-1.5 text-sm text-texto-suave">Qué es</p>
                <div className="flex flex-wrap gap-2">
                  {ICONOS_PUNTO.map((cual) => (
                    <button
                      key={cual}
                      type="button"
                      onClick={() => setEditando({ ...editando, icono: cual })}
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
            ) : (
              <div>
                <p className="mb-1.5 text-sm text-texto-suave">De qué color</p>
                <div className="flex flex-wrap gap-2">
                  {COLORES_DE_TRAZO.map((cual) => (
                    <button
                      key={cual}
                      type="button"
                      onClick={() => setEditando({ ...editando, color: cual })}
                      aria-pressed={editando.color === cual}
                      className={[
                        "flex min-h-14 items-center gap-2 rounded-xl border px-4 text-base font-semibold transition-colors",
                        editando.color === cual
                          ? "border-acento-borde bg-acento text-acento-texto"
                          : "border-borde bg-superficie-alta text-texto hover:border-borde-fuerte",
                      ].join(" ")}
                    >
                      <span
                        aria-hidden
                        className="h-3 w-6 rounded-full"
                        style={{ backgroundColor: TRAZO[cual].color }}
                      />
                      {TRAZO[cual].nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AreaDeTexto
              label="Qué hay que saber"
              id="comentario-de-la-anotacion"
              rows={3}
              value={editando.comentario}
              onChange={(evento) =>
                setEditando({ ...editando, comentario: evento.target.value })
              }
              placeholder={
                editando.tipo === "punto"
                  ? "Por acá se cruza el arroyo. Por la izquierda no se puede."
                  : "Huella que no figura en el mapa. Sigue el alambrado hasta la tranquera."
              }
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

            {editando.tipo === "punto" ? (
              <>
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
              </>
            ) : (
              <>
                <div className="rounded-xl border border-borde-suave bg-fondo px-3 py-2">
                  <p className="text-sm text-texto-suave">Por dónde va</p>
                  <p className="text-base font-semibold tabular-nums text-texto">
                    {editando.puntos.length === 0
                      ? "Todavía sin puntos"
                      : editando.puntos.length === 1
                        ? "1 punto: falta al menos uno más"
                        : `${editando.puntos.length} puntos`}
                  </p>
                </div>

                <Boton
                  variante={marcando ? "principal" : "secundario"}
                  anchoCompleto
                  onClick={() => setMarcando(!marcando)}
                >
                  {marcando ? "Tocá el mapa… (listo cuando termines)" : "Seguir dibujando"}
                </Boton>

                <div className="flex gap-2">
                  <Boton
                    variante="secundario"
                    anchoCompleto
                    disabled={editando.puntos.length === 0}
                    onClick={deshacerElUltimoPunto}
                  >
                    Deshacer el último punto
                  </Boton>
                  {editando.id !== null ? (
                    <Boton variante="secundario" anchoCompleto onClick={volverADibujar}>
                      Volver a dibujar
                    </Boton>
                  ) : null}
                </div>
              </>
            )}

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
              disabled={guardando || faltanPuntos}
              onClick={() => void alGuardar()}
            >
              {guardando
                ? "Guardando…"
                : editando.tipo === "punto"
                  ? "Guardar el punto"
                  : "Guardar el trazo"}
            </Boton>

            <Boton variante="fantasma" anchoCompleto disabled={guardando} onClick={cancelar}>
              Cancelar
            </Boton>
          </Tarjeta>
        ) : trayendo ? (
          <Tarjeta className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
              Desde {trayendo.deDonde}
            </h2>
            <p className="text-base leading-6 text-texto">
              {resumenDeImportacion(trayendo.importacion)}
            </p>
            <p className="text-sm leading-6 text-texto-suave">
              Ya están dibujadas en el mapa para que las mires. Después de agregarlas
              se pueden editar o borrar una por una, como cualquier anotación.
            </p>
            {errorAlTraer ? (
              <p
                role="alert"
                className="rounded-xl bg-rojo-fondo px-3 py-2 text-sm leading-6 text-rojo-texto"
              >
                {errorAlTraer}
              </p>
            ) : null}
            <Boton
              anchoCompleto
              paraNavegacion
              disabled={guardando || trayendo.importacion.dentro.length === 0}
              onClick={() => void agregarLoTraido()}
            >
              {guardando
                ? "Agregando…"
                : trayendo.importacion.dentro.length === 1
                  ? "Agregar la anotación"
                  : "Agregar las anotaciones"}
            </Boton>
            <Boton
              variante="fantasma"
              anchoCompleto
              disabled={guardando}
              onClick={() => {
                setTrayendo(null);
                setErrorAlTraer(null);
              }}
            >
              Cancelar
            </Boton>
          </Tarjeta>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Boton anchoCompleto paraNavegacion variante="principal" onClick={empezarUnPunto}>
                {marcando ? "Tocá el mapa para marcar el punto" : "Marcar un lugar"}
              </Boton>
              <Boton anchoCompleto paraNavegacion variante="secundario" onClick={empezarUnTrazo}>
                Dibujar un trazo
              </Boton>
            </div>

            <Tarjeta className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
                Traer de afuera
              </h2>
              <p className="text-sm leading-6 text-texto-suave">
                Lo que hayas marcado en Google Earth, o las tranqueras y alambrados
                que OpenStreetMap tenga en este sector. Antes de guardar se ve qué
                entra.
              </p>
              <input
                ref={entradaDeGoogleEarth}
                id="archivo-de-google-earth"
                type="file"
                accept={FORMATOS_DE_GOOGLE_EARTH}
                className="sr-only"
                onChange={(evento) => {
                  void alElegirArchivoDeGoogleEarth(evento.target.files?.[0] ?? null);
                }}
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Boton
                  anchoCompleto
                  variante="secundario"
                  disabled={buscando}
                  onClick={() => entradaDeGoogleEarth.current?.click()}
                >
                  {buscando ? "Leyendo…" : "Desde Google Earth"}
                </Boton>
                <Boton
                  anchoCompleto
                  variante="secundario"
                  disabled={buscando}
                  onClick={() => void traerDeOpenStreetMap()}
                >
                  {buscando ? "Preguntando…" : "Tranqueras y alambrados"}
                </Boton>
              </div>
              {errorAlTraer ? (
                <p
                  role="alert"
                  className="rounded-xl bg-rojo-fondo px-3 py-2 text-sm leading-6 text-rojo-texto"
                >
                  {errorAlTraer}
                </p>
              ) : null}
            </Tarjeta>
          </>
        )}

        <div className="space-y-2">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
            {anotaciones.length === 0 ? "Anotaciones" : `Anotaciones (${anotaciones.length})`}
          </h2>

          {anotaciones.length === 0 ? (
            <Tarjeta>
              <p className="text-sm leading-6 text-texto-suave">
                Este sector todavía no tiene anotaciones.
              </p>
            </Tarjeta>
          ) : (
            anotaciones.map((anotacion) => (
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
                    <p className="flex items-center gap-2 text-base font-semibold text-texto">
                      {anotacion.tipo === "trazo" ? (
                        <>
                          <span
                            aria-hidden
                            className="h-3 w-6 shrink-0 rounded-full"
                            style={{ backgroundColor: anotacion.color ?? undefined }}
                          />
                          Trazo · {nombreDelColor(anotacion.color)}
                        </>
                      ) : (
                        COMO_SE_LLAMA[anotacion.icono ?? "cruce"]
                      )}
                    </p>
                    {anotacion.comentario ? (
                      <p className="mt-1 text-sm leading-6 text-texto-suave">
                        {anotacion.comentario}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Boton variante="secundario" onClick={() => abrirParaEditar(anotacion)}>
                    Editar
                  </Boton>
                  <Boton variante="destructivo" onClick={() => void alBorrar(anotacion)}>
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
          anotaciones={enElMapa}
          marcandoPunto={marcando}
          alMarcarPunto={alMarcarPunto}
        />
        <p className="text-sm leading-6 text-texto-suave">{queHacerEnElMapa}</p>
      </Tarjeta>
    </div>
  );
}
