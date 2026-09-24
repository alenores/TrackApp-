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
import { useDialogos } from "@/components/ui/dialogos";
import { CamposDeAnotacion } from "@/components/anotaciones/campos-de-anotacion";
import { FORMAS_DE_RECORTE } from "@/components/fotos/recorte-de-foto";
import { useFoto } from "@/hooks/use-foto";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { ponerAlDiaDespuesDeGuardar } from "@/lib/offline/puesta-al-dia";
import { COMO_SE_LLAMA } from "@/lib/anotaciones/iconos";
import { anotacionesDelLugar } from "@/lib/anotaciones/lugar";
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
  type ColorDeTrazo,
  nombreDelColor,
  TRAZO,
} from "@/lib/anotaciones/colores-de-trazo";
import { type Anotacion, type IconoPunto } from "@/types/database";

const ICONOS_SVG: Record<IconoPunto, React.ReactNode> = {
  refugio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-texto-suave shrink-0">
      <path d="M3 12l9-8 9 8M5 10v10h14V10M9 20v-6h6v6" />
    </svg>
  ),
  cumbre: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-texto-suave shrink-0">
      <path d="M8 14l4-8 4 8M4 20h16" />
    </svg>
  ),
  pueblo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-texto-suave shrink-0">
      <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
      <path d="M9 7h6M9 11h6M9 15h6" />
    </svg>
  ),
  fuente: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-texto-suave shrink-0">
      <path d="M12 22a8 8 0 0 0 8-8c0-4-8-12-8-12S4 10 4 14a8 8 0 0 0 8 8z" />
    </svg>
  ),
  mirador: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-texto-suave shrink-0">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  iglesia: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-texto-suave shrink-0">
      <path d="M12 3v8M9 6h6M8 21V11l4-3 4 3v10z" />
    </svg>
  ),
  arroyo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-texto-suave shrink-0">
      <path d="M2 12 Q 7 5 12 12 T 22 12" />
    </svg>
  ),
  cascada: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-texto-suave shrink-0">
      <path d="M7 3v18M12 3v18M17 3v18" strokeDasharray="2 2"/>
    </svg>
  ),
  puente: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-texto-suave shrink-0">
      <path d="M3 18 Q 12 4 21 18" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  cartel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-texto-suave shrink-0">
      <rect x="5" y="4" width="14" height="8" />
      <line x1="12" y1="12" x2="12" y2="20" />
    </svg>
  ),
  cruce: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-texto-suave shrink-0">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  tranquera: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-texto-suave shrink-0">
      <path d="M4 4v16M20 4v16M4 12h16M4 8l16 8" />
    </svg>
  ),
};

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

  const [trayendo, setTrayendo] = useState<{
    deDonde: "Google Earth" | "OpenStreetMap";
    importacion: Importacion;
  } | null>(null);
  const [errorAlTraer, setErrorAlTraer] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [traidoConExito, setTraidoConExito] = useState<string | null>(null);

  const entradaDeGoogleEarth = useRef<HTMLInputElement>(null);

  const sector = paquete?.sectores.find((cada) => cada.id === sectorId) ?? null;
  const zona = paquete?.zonas.find((cada) => cada.id === zonaId) ?? null;
  // Las anotadas a este sector y las marcadas desde la navegación que caen
  // adentro: manda dónde está, no a qué sector se la anotó.
  const anotaciones = sector
    ? anotacionesDelLugar(paquete?.anotaciones ?? [], [sector])
    : [];

  const tieneTranquerasOAlambrados = anotaciones.some(
    (a) => a.icono === "tranquera" || a.color === "#a855f7"
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
      fotoChica: foto.archivoChico,
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
    await ponerAlDiaDespuesDeGuardar();
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
    await ponerAlDiaDespuesDeGuardar();
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
    setTraidoConExito(null);
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
    setTraidoConExito(null);
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
    const resultado = await crearAnotacionesEnTanda(
      sectorId,
      trayendo.importacion.dentro,
      trayendo.deDonde === "Google Earth" ? "google_earth" : "openstreetmap"
    );
    setGuardando(false);
    if (!resultado.ok) {
      setErrorAlTraer(resultado.error);
      return;
    }
    setTraidoConExito(trayendo.deDonde);
    setTrayendo(null);
    await ponerAlDiaDespuesDeGuardar();
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
      deAdministrador: false,
      origen: "manual" as const,
      comentario: editando.comentario,
      fotoUrl: null,
      fotoChicaUrl: null,
      marcadaEn: "",
      precisionGpsMetros: null,
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
          deAdministrador: false,
          origen: (trayendo.deDonde === "Google Earth" ? "google_earth" : "openstreetmap") as Anotacion["origen"],
          fotoUrl: null,
          fotoChicaUrl: null,
          marcadaEn: "",
          precisionGpsMetros: null,
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
    <div className="flex flex-col gap-3 max-w-2xl mx-auto">
      <div>
        <div className="flex items-center gap-3">
          <BotonVolver
            destinoSiNoHayVuelta={`/zonas/${zonaId}`}
            etiqueta="Volver a la zona"
          />
          <h1 className="min-w-0 flex-1 truncate text-2xl font-bold uppercase text-texto">
            Anotaciones
          </h1>
        </div>
        <div className="mt-1 pl-12">
          <p className="text-lg font-semibold text-texto">{sector.nombre}</p>
          <p className="text-sm text-texto-suave">{zona?.nombre}</p>
        </div>
      </div>

      <Tarjeta className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
          Dónde queda
        </h2>
        <CargadorDeMapa
          enVivo
          principal
          encuadre={sector.rectangulo}
          rectangulos={[{ rectangulo: sector.rectangulo, clase: "sector" }]}
          anotaciones={enElMapa}
          marcandoPunto={marcando}
          alMarcarPunto={alMarcarPunto}
        />
        <p className="text-sm leading-6 text-texto-suave">{queHacerEnElMapa}</p>
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

            <CamposDeAnotacion
              tipo={editando.tipo}
              icono={editando.tipo === "punto" ? editando.icono : "cruce"}
              alCambiarIcono={(icono) =>
                editando.tipo === "punto" && setEditando({ ...editando, icono })
              }
              color={editando.tipo === "trazo" ? editando.color : COLOR_DE_TRAZO_POR_DEFECTO}
              alCambiarColor={(color) =>
                editando.tipo === "trazo" && setEditando({ ...editando, color })
              }
              comentario={editando.comentario}
              alCambiarComentario={(comentario) => setEditando({ ...editando, comentario })}
              foto={foto}
              fotoActual={quitarLaFoto ? null : editando.fotoActual}
              alQuitarFotoActual={() => setQuitarLaFoto(true)}
              guardando={guardando}
            />

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
          <div className="space-y-3">
            <Tarjeta className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
                Anotación manual
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <Boton anchoCompleto variante="principal" onClick={empezarUnPunto}>
                  {marcando ? "Tocá el mapa" : "Marcar un lugar"}
                </Boton>
                <Boton anchoCompleto variante="secundario" onClick={empezarUnTrazo}>
                  Dibujar un trazo
                </Boton>
              </div>
            </Tarjeta>

            <div className="grid grid-cols-2 gap-3">
              <Tarjeta className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
                  Desde Google Earth
                </h2>
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
                <Boton
                  anchoCompleto
                  variante="secundario"
                  disabled={buscando}
                  onClick={() => entradaDeGoogleEarth.current?.click()}
                >
                  {buscando ? "Leyendo…" : "Subir archivo KML/KMZ"}
                </Boton>
              </Tarjeta>

              <Tarjeta className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
                  Descargar desde OpenStreetMap
                </h2>
                <Boton
                  anchoCompleto
                  variante="secundario"
                  disabled={buscando || traidoConExito === "OpenStreetMap" || tieneTranquerasOAlambrados}
                  onClick={() => void traerDeOpenStreetMap()}
                >
                  {buscando
                    ? "Preguntando…"
                    : traidoConExito === "OpenStreetMap" || tieneTranquerasOAlambrados
                      ? "✓ Ya descargado"
                      : "Tranqueras y alambrados"}
                </Boton>
              </Tarjeta>
            </div>

            {errorAlTraer ? (
              <p
                role="alert"
                className="rounded-xl bg-rojo-fondo px-3 py-2 text-sm leading-6 text-rojo-texto"
              >
                {errorAlTraer}
              </p>
            ) : null}
          </div>
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
            anotaciones.map((anotacion) => {
              let origenTexto = "";
              if (anotacion.origen === "google_earth") origenTexto = "Desde Google Earth";
              else if (anotacion.origen === "openstreetmap") origenTexto = "Desde OpenStreetMap";
              else if (anotacion.origen === "navegacion") origenTexto = anotacion.deAdministrador ? "Marcada navegando · administrador" : "Marcada navegando · usuario";
              else origenTexto = anotacion.tipo === "punto" ? "Punto marcado a mano" : "Trazo manual";

              return (
                <Tarjeta key={anotacion.id} tono="alta" className="relative pr-16 space-y-2">
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => abrirParaEditar(anotacion)}
                      className="p-2 text-texto-suave hover:text-texto hover:bg-superficie rounded-lg transition-colors"
                      aria-label="Editar"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => void alBorrar(anotacion)}
                      className="p-2 text-rojo-texto hover:bg-rojo-fondo rounded-lg transition-colors"
                      aria-label="Borrar"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <path d="M3 6h18" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>

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
                      {anotacion.origen === "openstreetmap" ? (
                        <p className="flex items-center gap-2 text-base font-semibold text-texto">
                          {anotacion.tipo === "trazo" ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-texto-suave shrink-0">
                              <path d="M4 4v16M20 4v16M4 8h16M4 16h16" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-texto-suave shrink-0">
                              <path d="M4 4v16M20 4v16M4 12h16M4 8l16 8" />
                            </svg>
                          )}
                          {anotacion.comentario}
                        </p>
                      ) : (
                        <p className="flex items-center gap-2 text-base font-semibold text-texto">
                          {anotacion.tipo === "trazo" ? (
                            <>
                              <span
                                aria-hidden
                                className="h-3 w-6 shrink-0 rounded-full"
                                style={{ backgroundColor: anotacion.color ?? undefined }}
                              />
                              {nombreDelColor(anotacion.color)}
                            </>
                          ) : (
                            <>
                              {ICONOS_SVG[anotacion.icono ?? "cruce"]}
                              {COMO_SE_LLAMA[anotacion.icono ?? "cruce"]}
                            </>
                          )}
                        </p>
                      )}
                      
                      <p className="text-xs uppercase tracking-wide text-texto-suave mt-1 font-semibold">
                        {origenTexto}
                      </p>

                      {anotacion.comentario && anotacion.origen !== "openstreetmap" ? (
                        <p className="mt-2 text-sm leading-6 text-texto-suave">
                          {anotacion.comentario}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Tarjeta>
              );
            })
          )}
        </div>
    </div>
  );
}
