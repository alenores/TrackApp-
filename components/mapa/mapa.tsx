"use client";

import { useEffect, useRef } from "react";
import type { FeatureCollection } from "geojson";
import L from "leaflet";
import { elegirFondo } from "@/components/mapa/capas-base";
import type { Anotacion, Rectangulo } from "@/types/database";
import "leaflet/dist/leaflet.css";

/**
 * **El único mapa de la app.**
 *
 * Los tres modos —sin mapa, mapa simple y mapa satelital— son este mismo mapa
 * con distinto fondo. No son tres pantallas.
 *
 * Ver docs/decisiones/008-tres-modos-de-uso-y-permisos.md
 */

/**
 * Los colores no se escriben acá: salen de las variables, con una clase de
 * CSS. Leaflet no entiende las clases de Tailwind, pero sí pinta lo que le
 * diga una clase común, y así el mapa cambia junto con el modo sol o noche.
 */
const ESTILO_DE_LA_RUTA: L.PathOptions = {
  className: "ruta-linea",
  weight: 5,
  opacity: 0.95,
  lineCap: "round",
  lineJoin: "round",
};

export type PosicionEnElMapa = {
  lat: number;
  lon: number;
};

type MapaProps = {
  /** La línea de la ruta. */
  recorrido?: FeatureCollection | null;
  /** Los puntos y trazos que el administrador dibujó sobre el territorio. */
  anotaciones?: Anotacion[];
  /** Dónde está el usuario, si el GPS está andando. */
  miPosicion?: PosicionEnElMapa | null;
  /** A qué encuadrar al abrir. */
  encuadre?: Rectangulo | null;
  /** `true` en la pantalla de navegación, que va a pantalla completa. */
  pantallaCompleta?: boolean;
  className?: string;
};

function limitesDe(rectangulo: Rectangulo): L.LatLngBoundsExpression {
  return [
    [rectangulo.latSur, rectangulo.lonOeste],
    [rectangulo.latNorte, rectangulo.lonEste],
  ];
}

export function Mapa({
  recorrido = null,
  anotaciones = [],
  miPosicion = null,
  encuadre = null,
  pantallaCompleta = false,
  className = "",
}: MapaProps) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const capaDeLaRutaRef = useRef<L.GeoJSON | null>(null);
  const capaDeAnotacionesRef = useRef<L.LayerGroup | null>(null);
  const marcaDePosicionRef = useRef<L.CircleMarker | null>(null);

  // Armado del mapa. Una sola vez.
  useEffect(() => {
    if (!contenedorRef.current || mapaRef.current) return;

    const mapa = L.map(contenedorRef.current, {
      zoomControl: true,
      attributionControl: true,
      // El mundo entero, para que sin capa de fondo igual se pueda navegar.
      center: [-31.5, -64.5],
      zoom: 10,
    });

    const fondo = elegirFondo();
    if (fondo.crearCapa) {
      fondo.crearCapa().addTo(mapa);
    }

    capaDeAnotacionesRef.current = L.layerGroup().addTo(mapa);
    mapaRef.current = mapa;

    return () => {
      mapa.remove();
      mapaRef.current = null;
      capaDeLaRutaRef.current = null;
      capaDeAnotacionesRef.current = null;
      marcaDePosicionRef.current = null;
    };
  }, []);

  // La línea de la ruta.
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;

    capaDeLaRutaRef.current?.remove();
    capaDeLaRutaRef.current = null;

    if (!recorrido) return;

    const capa = L.geoJSON(recorrido, { style: ESTILO_DE_LA_RUTA });
    capa.addTo(mapa);
    capaDeLaRutaRef.current = capa;

    if (encuadre) {
      mapa.fitBounds(limitesDe(encuadre), { padding: [28, 28] });
      return;
    }

    const limites = capa.getBounds();
    if (limites.isValid()) {
      mapa.fitBounds(limites, { padding: [28, 28] });
    }
  }, [recorrido, encuadre]);

  // Los puntos y trazos.
  useEffect(() => {
    const capa = capaDeAnotacionesRef.current;
    if (!capa) return;

    capa.clearLayers();

    for (const anotacion of anotaciones) {
      if (anotacion.tipo === "trazo" && anotacion.geometria.type === "LineString") {
        // Un color elegido a mano es un dato del usuario y manda sobre el
        // color del modo.
        L.geoJSON(anotacion.geometria, {
          style: anotacion.color
            ? { color: anotacion.color, weight: 3, opacity: 0.95 }
            : { className: "anotacion-trazo", weight: 3, opacity: 0.95 },
        }).addTo(capa);
        continue;
      }

      if (anotacion.tipo === "punto" && anotacion.geometria.type === "Point") {
        const [lon, lat] = anotacion.geometria.coordinates;
        const marca = L.circleMarker([lat, lon], {
          radius: 7,
          weight: 2,
          fillOpacity: 1,
          ...(anotacion.color
            ? { color: "currentColor", fillColor: anotacion.color }
            : { className: "anotacion-punto" }),
        });

        const titulo = [anotacion.icono, anotacion.comentario]
          .filter(Boolean)
          .join(" · ");
        if (titulo) marca.bindTooltip(titulo);

        marca.addTo(capa);
      }
    }
  }, [anotaciones]);

  // Dónde estoy.
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa) return;

    if (!miPosicion) {
      marcaDePosicionRef.current?.remove();
      marcaDePosicionRef.current = null;
      return;
    }

    const donde: L.LatLngExpression = [miPosicion.lat, miPosicion.lon];

    if (marcaDePosicionRef.current) {
      marcaDePosicionRef.current.setLatLng(donde);
      return;
    }

    marcaDePosicionRef.current = L.circleMarker(donde, {
      radius: 10,
      weight: 3,
      fillOpacity: 1,
      className: "mi-posicion",
    }).addTo(mapa);
  }, [miPosicion]);

  return (
    <div
      ref={contenedorRef}
      className={[
        pantallaCompleta
          ? "h-full w-full"
          : "h-64 w-full overflow-hidden rounded-xl border border-borde sm:h-80",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
