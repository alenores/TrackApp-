"use client";

import { useState } from "react";
import type { Position } from "geojson";
import { BotonRedondo } from "@/components/ui/boton-redondo";
import { ICONO_DE_AYUDA } from "@/components/ui/iconos";
import { GraficoDeAlturas } from "@/components/ui/grafico-de-alturas";
import { ReferenciaDePartes } from "@/components/rutas/referencia-de-partes";
import { textoDeAltura, textoDeDistancia, type EstiloDeTramo } from "@/lib/alturas/grafico";
import type { AlturasDelCircuito } from "@/lib/circuitos/alturas";
import {
  dibujarMiniatura,
  type SegmentoDeMiniatura,
} from "@/lib/circuitos/miniatura";
import type { CondicionDePaso } from "@/lib/caminos/partes";

/**
 * Lo que se ve al tocar Información, navegando un Circuito.
 *
 * Arriba el nombre y la forma vista desde arriba, con los colores de cada
 * tramo. La ayuda de colores y líneas se abre solo con el círculo de ayuda.
 * Abajo queda el gráfico de alturas, con «Estás acá» y lo que falta.
 */

const CAJA = { x: 16, y: 16, ancho: 288, alto: 148 };
const ANCHO = 320;
const ALTO = 180;

const COLOR: Record<EstiloDeTramo, string> = {
  facil: "var(--parte-facil)",
  media: "var(--parte-media)",
  dificil: "var(--parte-dificil)",
  sin_clasificar: "var(--parte-sin-clasificar)",
  propio: "var(--circuito-propio)",
};

function guionesDe(paso: CondicionDePaso | null): string | undefined {
  if (paso === "por_explorar") return "8 6";
  if (paso === "a_pie") return "2 6";
  return undefined;
}

function Miniatura({ segmentos, aqui }: { segmentos: SegmentoDeMiniatura[]; aqui: Position | null }) {
  const dibujo = dibujarMiniatura(segmentos, CAJA, aqui);
  if (!dibujo) {
    return <p role="alert" className="text-lg text-texto">Este Circuito no tiene una línea para dibujar.</p>;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-borde-fuerte bg-superficie">
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-label="Forma del Circuito, vista desde arriba" className="h-44 w-full">
        {dibujo.trazos.map((trazo, indice) => (
          <g key={indice}>
            <polyline
              points={trazo.puntos.map(([x, y]) => `${x},${y}`).join(" ")}
              fill="none"
              stroke={COLOR[trazo.estilo]}
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={guionesDe(trazo.paso)}
            />
            {trazo.cruz ? (
              <text
                x={trazo.cruz[0]}
                y={trazo.cruz[1] - 8}
                textAnchor="middle"
                fontSize={16}
                fontWeight={800}
                fill="var(--parte-x)"
                stroke="var(--parte-x-halo)"
                strokeWidth={3}
                paintOrder="stroke"
              >
                ✕
              </text>
            ) : null}
          </g>
        ))}
        {dibujo.aqui ? (
          <circle cx={dibujo.aqui[0]} cy={dibujo.aqui[1]} r={7} fill="var(--gps)" stroke="var(--superficie)" strokeWidth={3} />
        ) : null}
      </svg>
    </div>
  );
}

type AlturasListas = { ok: true; datos: AlturasDelCircuito } | { ok: false; error: string };

export function InformacionDelCircuito({
  nombre,
  segmentos,
  leyendo,
  avisoDeLinea,
  aqui,
  dondeEstas,
  alturas,
  falta,
  textoSinMarca,
  aquiM,
}: {
  nombre: string;
  segmentos: SegmentoDeMiniatura[] | null;
  leyendo: boolean;
  avisoDeLinea: string | null;
  aqui: Position | null;
  dondeEstas: string;
  alturas: AlturasListas | null;
  falta: { metros: number; desnivelPositivoM: number; desnivelNegativoM: number } | null;
  textoSinMarca: string;
  aquiM: number | null;
}) {
  const [verAyuda, setVerAyuda] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-lg font-bold text-texto">{nombre}</p>
        <BotonRedondo
          etiqueta={verAyuda ? "Ocultar qué significa cada color y línea" : "Ver qué significa cada color y línea"}
          aria-expanded={verAyuda}
          onClick={() => setVerAyuda((antes) => !antes)}
        >
          {ICONO_DE_AYUDA}
        </BotonRedondo>
      </div>

      {leyendo ? <p role="status" className="text-lg text-texto">Leyendo los Caminos guardados…</p>
        : avisoDeLinea ? <p role="alert" className="text-lg text-texto">{avisoDeLinea}</p>
          : segmentos ? <Miniatura segmentos={segmentos} aqui={aqui} /> : null}

      {verAyuda ? <ReferenciaDePartes navegando conPartesPropias /> : null}

      <p className="text-lg text-texto">{dondeEstas}</p>

      {!alturas ? <p role="alert" className="text-lg text-texto">Las alturas de este Circuito todavía no están en el celular. Abrí la app con señal en casa para ponerla al día.</p>
        : !alturas.ok ? <p role="alert" className="text-lg text-texto">{alturas.error}</p>
          : <div className="space-y-3">
            {falta ? <p className="text-lg text-texto">
              Hasta el final: <strong>{textoDeDistancia(falta.metros)}</strong> · desnivel positivo <strong>{textoDeAltura(falta.desnivelPositivoM)}</strong> · negativo <strong>{textoDeAltura(falta.desnivelNegativoM)}</strong>
            </p> : <p className="text-lg text-texto">{textoSinMarca}</p>}
            <GraficoDeAlturas
              perfil={alturas.datos.perfil}
              tramos={alturas.datos.tramos}
              aquiM={aquiM}
              enNavegacion
              descripcion={`Alturas del Circuito: ${textoDeDistancia(alturas.datos.largoM)}, desnivel positivo ${textoDeAltura(alturas.datos.desnivelPositivoM)} y negativo ${textoDeAltura(alturas.datos.desnivelNegativoM)}.`}
            />
          </div>}
    </div>
  );
}
