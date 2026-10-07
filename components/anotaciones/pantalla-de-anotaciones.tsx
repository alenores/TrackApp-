"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { crearAnotacionesEnTanda } from "@/app/actions/territorio";
import { EditorDeAnotaciones } from "@/components/anotaciones/editor-de-anotaciones";
import { BotonVolver } from "@/components/ui/boton-volver";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { ponerAlDiaDespuesDeGuardar } from "@/lib/offline/puesta-al-dia";
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
import type { Anotacion, CategoriaUsuario, Sector } from "@/types/database";
import { puedeSumarAlMapa } from "@/lib/mapas/permisos";

/**
 * Las anotaciones de un sector. Es la pantalla de anotaciones compartida, la
 * misma de Mapas, mirando este sector.
 *
 * **Lo único propio del sector es traer de afuera**: de un archivo de Google
 * Earth o las tranqueras y alambrados de OpenStreetMap. Las dos cosas traen
 * lo que cae adentro de un rectángulo, y el sector les da ese límite. Siempre
 * con vista previa: se dice qué entra, qué queda afuera y qué ya estaba.
 */

type Props = {
  zonaId: number;
  sectorId: number;
  categoria: CategoriaUsuario;
  miPerfilId: string | null;
};

type Trayendo = {
  deDonde: "Google Earth" | "OpenStreetMap";
  importacion: Importacion;
};

export function PantallaDeAnotaciones({ zonaId, sectorId, categoria, miPerfilId }: Props) {
  const { paquete, estado } = useDatosDeLaApp();
  const sector = paquete?.sectores.find((cada) => cada.id === sectorId) ?? null;
  const zona = paquete?.zonas.find((cada) => cada.id === zonaId) ?? null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3">
      <div>
        <div className="flex items-center gap-3">
          <BotonVolver destinoSiNoHayVuelta={`/zonas/${zonaId}`} etiqueta="Volver a la zona" />
          <h1 className="min-w-0 flex-1 truncate text-2xl font-bold uppercase text-texto">Anotaciones</h1>
        </div>
        {sector ? (
          <div className="mt-1 pl-12">
            <p className="text-lg font-semibold text-texto">{sector.nombre}</p>
            <p className="text-sm text-texto-suave">{zona?.nombre}</p>
          </div>
        ) : null}
      </div>

      {estado === "abriendo" ? (
        <Tarjeta className="py-8 text-center text-base text-texto-suave">Abriendo el sector…</Tarjeta>
      ) : !sector ? (
        <Tarjeta franja="ambar" className="space-y-2">
          <p className="text-base font-medium text-texto">Este sector no está en el celular.</p>
          <p className="text-base leading-6 text-texto-suave">
            Puede que lo hayan borrado. Volvé a la zona y conectate para ver los sectores al día.
          </p>
        </Tarjeta>
      ) : (
        <AnotacionesDelSector sector={sector} todas={paquete?.anotaciones ?? []} categoria={categoria} miPerfilId={miPerfilId} />
      )}
    </div>
  );
}

function AnotacionesDelSector({ sector, todas, categoria, miPerfilId }: { sector: Sector; todas: Anotacion[]; categoria: CategoriaUsuario; miPerfilId: string | null }) {
  const router = useRouter();
  const [trayendo, setTrayendo] = useState<Trayendo | null>(null);
  const [errorAlTraer, setErrorAlTraer] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const [traidoConExito, setTraidoConExito] = useState<string | null>(null);
  const entradaDeGoogleEarth = useRef<HTMLInputElement>(null);

  const delSector = anotacionesDelLugar(todas, [sector]);
  const yaTieneLoDeOsm = delSector.some((cada) => cada.origen === "openstreetmap");

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
      importacion: anotacionesDeGoogleEarth(lectura.figuras, sector.rectangulo, delSector),
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
        setErrorAlTraer(cuerpo.error ?? `OpenStreetMap contestó ${respuesta.status}. Probá de nuevo en un rato.`);
        return;
      }
      setTrayendo({
        deDonde: "OpenStreetMap",
        importacion: anotacionesDeOsm(cuerpo, sector.rectangulo, delSector),
      });
    } catch (error) {
      setErrorAlTraer(
        `No se pudo preguntar a OpenStreetMap: ${
          error instanceof Error && error.message ? error.message : "sin conexión"
        }. Probá de nuevo con mejor señal.`,
      );
    } finally {
      setBuscando(false);
    }
  };

  const agregarLoTraido = async () => {
    if (!trayendo) return;
    setAgregando(true);
    setErrorAlTraer(null);
    const resultado = await crearAnotacionesEnTanda(
      sector.id,
      trayendo.importacion.dentro,
      trayendo.deDonde === "Google Earth" ? "google_earth" : "openstreetmap",
    );
    setAgregando(false);
    if (!resultado.ok) {
      setErrorAlTraer(resultado.error);
      return;
    }
    setTraidoConExito(trayendo.deDonde);
    setTrayendo(null);
    await ponerAlDiaDespuesDeGuardar();
    router.refresh();
  };

  // Lo que se va a agregar, dibujado antes de guardarlo. Los números negativos
  // son de mentira: todavía no existen en la base.
  const porAgregar: Anotacion[] = trayendo
    ? trayendo.importacion.dentro.map((cada, indice) => ({
        ...cada,
        id: -(indice + 1),
        sectorId: sector.id,
        perfilId: "",
        deAdministrador: false,
        origen: trayendo.deDonde === "Google Earth" ? "google_earth" : "openstreetmap",
        fotoUrl: null,
        fotoChicaUrl: null,
        marcadaEn: "",
        precisionGpsMetros: null,
        creadoEn: "",
        actualizadoEn: "",
      }))
    : [];

  const herramientas = trayendo ? (
    <Tarjeta className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
        Desde {trayendo.deDonde}
      </h2>
      <p className="text-base leading-6 text-texto">{resumenDeImportacion(trayendo.importacion)}</p>
      <p className="text-sm leading-6 text-texto-suave">
        Ya están dibujadas en el mapa para que las mires. Después de agregarlas se pueden abrir,
        cambiar o borrar una por una, como cualquier anotación.
      </p>
      {errorAlTraer ? (
        <p role="alert" className="rounded-xl bg-rojo-fondo px-3 py-2 text-base leading-6 text-rojo-texto">
          {errorAlTraer}
        </p>
      ) : null}
      <Boton
        anchoCompleto
        disabled={agregando || trayendo.importacion.dentro.length === 0}
        onClick={() => void agregarLoTraido()}
      >
        {agregando
          ? "Agregando…"
          : trayendo.importacion.dentro.length === 1
            ? "Agregar la anotación"
            : "Agregar las anotaciones"}
      </Boton>
      <Boton
        variante="secundario"
        anchoCompleto
        disabled={agregando}
        onClick={() => {
          setTrayendo(null);
          setErrorAlTraer(null);
        }}
      >
        Cancelar
      </Boton>
    </Tarjeta>
  ) : (
    <Tarjeta className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">Traer de afuera</h2>
      <input
        ref={entradaDeGoogleEarth}
        type="file"
        accept={FORMATOS_DE_GOOGLE_EARTH}
        className="sr-only"
        onChange={(evento) => void alElegirArchivoDeGoogleEarth(evento.target.files?.[0] ?? null)}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <Boton
          anchoCompleto
          variante="secundario"
          disabled={buscando}
          onClick={() => entradaDeGoogleEarth.current?.click()}
        >
          {buscando ? "Leyendo…" : "Archivo de Google Earth"}
        </Boton>
        <Boton
          anchoCompleto
          variante="secundario"
          disabled={buscando || traidoConExito === "OpenStreetMap" || yaTieneLoDeOsm}
          onClick={() => void traerDeOpenStreetMap()}
        >
          {buscando
            ? "Preguntando…"
            : traidoConExito === "OpenStreetMap" || yaTieneLoDeOsm
              ? "Tranqueras ya traídas"
              : "Tranqueras de OpenStreetMap"}
        </Boton>
      </div>
      {traidoConExito ? (
        <p role="status" className="text-base text-texto">Listo: se agregó lo de {traidoConExito}.</p>
      ) : null}
      {errorAlTraer ? (
        <p role="alert" className="rounded-xl bg-rojo-fondo px-3 py-2 text-base leading-6 text-rojo-texto">
          {errorAlTraer}
        </p>
      ) : null}
    </Tarjeta>
  );

  return (
    <EditorDeAnotaciones
      lugar={{ clase: "sector", sector }}
      puedeAnotar={puedeSumarAlMapa(categoria)}
      miPerfilId={miPerfilId}
      esAdministrador={categoria === "administrador"}
      herramientas={herramientas}
      anotacionesPorAgregar={porAgregar}
      trayendo={trayendo !== null}
    />
  );
}
