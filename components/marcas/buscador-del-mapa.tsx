"use client";

import { useMemo, useState, type ReactNode } from "react";
import { queEs } from "@/components/anotaciones/icono-de-anotacion";
import { IconoDeClase } from "@/components/marcas/icono-de-clase";
import { Boton } from "@/components/ui/boton";
import { BotonRedondo } from "@/components/ui/boton-redondo";
import { Campo } from "@/components/ui/campo";
import { Emergente } from "@/components/ui/emergente";
import { CLASE_DE_TITULO_DE_SECCION } from "@/components/ui/opciones";
import type { CaminoGuardado, CaminoSinLinea } from "@/lib/caminos/datos";
import { sonLugaresDeInternet, type LugarDeInternet } from "@/lib/mapas/lugares-de-internet";
import {
  buscarAlMarcar,
  encuadreAlMarcar,
  type ClaseAlMarcar,
  type ElementoAlMarcar,
} from "@/lib/marcas/buscar-al-marcar";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";
import type { Anotacion, Rectangulo, Sector, Zona } from "@/types/database";

/**
 * La lupa del mapa al marcar.
 *
 * Mientras se escribe, filtra zonas, sectores, Caminos, puntos y trazos: eso
 * ya está en la app. Los pueblos y las ciudades se buscan recién al apretar
 * el botón, una sola vez.
 */

const TOPE_DE_ESPERA_MS = 15_000;

export function BuscadorDelMapa({
  zonas,
  sectores,
  caminosSinLinea,
  caminos,
  anotaciones,
  cargandoCaminos,
  alElegir,
}: {
  zonas: Zona[];
  sectores: Sector[];
  caminosSinLinea: CaminoSinLinea[];
  caminos: CaminoGuardado[];
  anotaciones: Anotacion[];
  cargandoCaminos: boolean;
  /** `clase` vacía cuando el lugar es un pueblo: no prende líneas solo. */
  alElegir: (encuadre: Rectangulo, clase: ClaseAlMarcar | null) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [pueblos, setPueblos] = useState<LugarDeInternet[]>([]);
  const [buscoPueblos, setBuscoPueblos] = useState(false);
  const [buscando, setBuscando] = useState(false);

  const elementos = useMemo(
    () => armarElementos(zonas, sectores, caminosSinLinea, anotaciones),
    [zonas, sectores, caminosSinLinea, anotaciones],
  );
  const busqueda = useMemo(() => buscarAlMarcar(texto, elementos), [texto, elementos]);
  const hayTexto = texto.trim().length > 0;

  const cerrar = () => setAbierto(false);

  const elegirDeLaApp = (clase: ClaseAlMarcar, id: number) => {
    const lugar = encuadreAlMarcar({ clase, id }, zonas, sectores, caminos, anotaciones, cargandoCaminos);
    if ("aviso" in lugar) {
      setAviso(lugar.aviso);
      return;
    }
    setAviso(null);
    alElegir(lugar.encuadre, clase);
    cerrar();
  };

  const elegirPueblo = (pueblo: LugarDeInternet) => {
    setAviso(null);
    alElegir(pueblo.encuadre, null);
    cerrar();
  };

  const buscarPueblos = async () => {
    const consulta = texto.trim();
    if (consulta.length < 2 || buscando) return;
    setBuscando(true);
    setAviso(null);
    setBuscoPueblos(true);
    try {
      const respuesta = await fetch(`/api/lugares?q=${encodeURIComponent(consulta)}`, {
        signal: AbortSignal.timeout(TOPE_DE_ESPERA_MS),
        cache: "no-store",
      });
      const datos: unknown = await respuesta.json();
      if (!respuesta.ok) {
        const motivo = datos && typeof datos === "object" && "error" in datos && typeof datos.error === "string"
          ? datos.error
          : "No hubo una respuesta clara.";
        setPueblos([]);
        setAviso(motivo);
        return;
      }
      const lugares = sonLugaresDeInternet(
        datos && typeof datos === "object" && "lugares" in datos ? datos.lugares : [],
      );
      setPueblos(lugares);
      if (lugares.length === 0) {
        setAviso("No encontré pueblos ni ciudades con ese nombre en Argentina. Probá con el nombre de la localidad.");
      }
    } catch (causa) {
      setPueblos([]);
      const seCorto = causa instanceof Error && (causa.name === "TimeoutError" || causa.name === "AbortError");
      setAviso(seCorto
        ? "El mapa de pueblos tardó demasiado. Revisá la señal y volvé a apretar Buscar pueblos."
        : `No se pudo buscar pueblos: ${causa instanceof Error ? causa.message : "no hubo respuesta"}. Revisá la señal y volvé a apretar Buscar pueblos.`);
    } finally {
      setBuscando(false);
    }
  };

  return (
    <>
      <BotonRedondo etiqueta="Buscar" onClick={() => setAbierto(true)}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3-3" />
      </BotonRedondo>
      <Emergente abierto={abierto} alCerrar={cerrar} titulo="Buscar" descripcion="Lo de la app se filtra al escribir. Los pueblos, al apretar el botón.">
        <div className="space-y-4">
          <Campo
            label="Buscar"
            type="search"
            placeholder="Zona, Camino, punto o pueblo"
            value={texto}
            autoComplete="off"
            spellCheck={false}
            onChange={(evento) => {
              setTexto(evento.target.value);
              setAviso(null);
              setPueblos([]);
              setBuscoPueblos(false);
            }}
          />
          <Boton
            variante="secundario"
            anchoCompleto
            disabled={texto.trim().length < 2 || buscando}
            onClick={() => void buscarPueblos()}
          >
            {buscando ? "Buscando pueblos…" : "Buscar pueblos"}
          </Boton>
          {aviso ? <p role="status" className="text-base text-texto">{aviso}</p> : null}

          {hayTexto ? (
            <Lista
              titulo="En la app"
              vacio="Nada de lo cargado coincide con eso."
              etiqueta="Resultados de la app"
            >
              {busqueda.lista.map((coincidencia) => (
                <Renglon
                  key={`${coincidencia.clase}-${coincidencia.id}`}
                  titulo={coincidencia.titulo}
                  aclaracion={coincidencia.aclaracion}
                  icono={coincidencia.clase === "sector" ? null : <IconoDeClase grupo={coincidencia.clase} />}
                  alTocar={() => elegirDeLaApp(coincidencia.clase, coincidencia.id)}
                />
              ))}
            </Lista>
          ) : (
            <p className="text-base text-texto-suave">Escribí una zona, un sector, un Camino, un punto o un pueblo.</p>
          )}
          {busqueda.hayMas ? (
            <p role="status" className="text-base text-texto-suave">Hay más en la app. Seguí escribiendo para achicar la lista.</p>
          ) : null}

          {buscoPueblos && pueblos.length > 0 ? (
            <div className="space-y-2">
              <Lista titulo="Pueblos y ciudades" vacio="" etiqueta="Pueblos y ciudades">
                {pueblos.map((pueblo) => (
                  <Renglon
                    key={`${pueblo.nombre}-${pueblo.encuadre.latNorte}-${pueblo.encuadre.lonOeste}`}
                    titulo={pueblo.nombre}
                    aclaracion={pueblo.aclaracion}
                    icono={null}
                    alTocar={() => elegirPueblo(pueblo)}
                  />
                ))}
              </Lista>
              <p className="text-sm text-texto-suave">Esos lugares salen de OpenStreetMap.</p>
            </div>
          ) : null}
        </div>
      </Emergente>
    </>
  );
}

function Lista({
  titulo,
  vacio,
  etiqueta,
  children,
}: {
  titulo: string;
  vacio: string;
  etiqueta: string;
  children: ReactNode;
}) {
  const hay = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="space-y-2">
      <p className={CLASE_DE_TITULO_DE_SECCION}>{titulo}</p>
      {hay ? (
        <ul className="space-y-1" aria-label={etiqueta}>{children}</ul>
      ) : vacio ? (
        <p role="status" className="text-base text-texto-suave">{vacio}</p>
      ) : null}
    </div>
  );
}

function Renglon({
  titulo,
  aclaracion,
  icono,
  alTocar,
}: {
  titulo: string;
  aclaracion: string;
  icono: ReactNode;
  alTocar: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={alTocar}
        className={`${CLASE_DE_RESPUESTA_AL_TOQUE} flex min-h-10 w-full items-center gap-3 rounded-lg text-left hover:bg-superficie-alta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde`}
      >
        {icono ? <span className="text-texto-suave">{icono}</span> : null}
        <span className="min-w-0 flex-1 truncate text-base font-semibold text-texto">{titulo}</span>
        <span className="shrink-0 text-base text-texto-suave">{aclaracion}</span>
      </button>
    </li>
  );
}

function armarElementos(
  zonas: Zona[],
  sectores: Sector[],
  caminos: CaminoSinLinea[],
  anotaciones: Anotacion[],
): ElementoAlMarcar[] {
  return [
    ...zonas.map((zona): ElementoAlMarcar => ({
      clase: "zona", id: zona.id, titulo: zona.nombre, aclaracion: "Zona", textos: [zona.nombre],
    })),
    ...sectores.map((sector): ElementoAlMarcar => ({
      clase: "sector", id: sector.id, titulo: sector.nombre, aclaracion: "Sector", textos: [sector.nombre],
    })),
    ...caminos.map((camino): ElementoAlMarcar => ({
      clase: "camino", id: camino.id, titulo: camino.nombre, aclaracion: "Camino", textos: [camino.nombre],
    })),
    ...anotaciones.map((anotacion): ElementoAlMarcar => {
      const nombre = queEs(anotacion);
      const comentario = anotacion.comentario?.trim() ?? "";
      const esTrazo = anotacion.tipo === "trazo";
      return {
        clase: esTrazo ? "trazo" : "punto",
        id: anotacion.id,
        titulo: comentario || nombre,
        aclaracion: esTrazo ? "Trazo" : nombre,
        textos: comentario ? [comentario, nombre] : [nombre],
      };
    }),
  ];
}
