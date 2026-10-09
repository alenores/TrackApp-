"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { PuntoDelPerfil } from "@/lib/alturas/perfil";
import {
  ejesDelGrafico,
  puntoMasCercano,
  textoDeAltura,
  textoDeDistancia,
  type EstiloDeTramo,
  type TramoDelPerfil,
} from "@/lib/alturas/grafico";
import type { CondicionDePaso } from "@/lib/caminos/partes";

/**
 * El gráfico de alturas: cuánto sube y baja una línea a lo largo de su largo,
 * como en las apps de montaña. Ver decisión 049.
 *
 * Solo dibuja lo que recibe. Si se le pasan tramos, cada pedazo de la línea
 * lleva el color de su complejidad y la marca de su condición de paso, igual
 * que en el mapa. Al pasar el mouse o el dedo, dice la altura y la distancia
 * de ese punto y avisa a quien lo usa, para que el mapa lo marque.
 *
 * El dibujo se arma al ancho real que ocupa: así la letra mide lo que dice
 * medir y no se achica en el celular.
 */

export type TramoDelGrafico = TramoDelPerfil;

type Propiedades = {
  perfil: PuntoDelPerfil[];
  tramos?: TramoDelGrafico[];
  /** Dónde está el usuario, en metros desde el comienzo. */
  aquiM?: number | null;
  /** Avisa qué distancia se está señalando, o `null` al dejar de señalar. */
  alSenalar?: (distanciaM: number | null) => void;
  /** En la navegación la letra va más grande (18 px). */
  enNavegacion?: boolean;
  /** Qué describe el gráfico, para quien no lo ve. */
  descripcion: string;
};

const COLOR: Record<EstiloDeTramo, string> = {
  facil: "var(--parte-facil)",
  media: "var(--parte-media)",
  dificil: "var(--parte-dificil)",
  sin_clasificar: "var(--parte-sin-clasificar)",
  propio: "var(--circuito-propio)",
};

function trazoDe(paso: CondicionDePaso | null | undefined): string | undefined {
  if (paso === "por_explorar") return "8 6";
  if (paso === "a_pie") return "2 6";
  return undefined;
}

export function GraficoDeAlturas({ perfil, tramos, aquiM = null, alSenalar, enNavegacion = false, descripcion }: Propiedades) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(0);
  const [senalado, setSenalado] = useState<PuntoDelPerfil | null>(null);

  useEffect(() => {
    const elemento = contenedor.current;
    if (!elemento) return;
    const medir = () => setAncho(Math.round(elemento.getBoundingClientRect().width));
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  const letra = enNavegacion ? 18 : 16;
  const alto = enNavegacion ? 210 : 190;
  const izquierda = letra * 4.2;
  const derecha = 8;
  const arriba = aquiM === null ? 10 : letra + 12;
  const abajo = letra + 14;

  const ejes = useMemo(() => ejesDelGrafico(perfil, 4, Math.max(2, Math.floor(ancho / (letra * 5.5)))), [perfil, ancho, letra]);
  const anchoUtil = Math.max(1, ancho - izquierda - derecha);
  const altoUtil = alto - arriba - abajo;
  const x = (distanciaM: number) => izquierda + (ejes.largoM === 0 ? 0 : (distanciaM / ejes.largoM) * anchoUtil);
  const y = (alturaM: number) => arriba + ((ejes.alturaMaximaM - alturaM) / (ejes.alturaMaximaM - ejes.alturaMinimaM || 1)) * altoUtil;

  const pedazos = useMemo(() => {
    const lista = tramos && tramos.length > 0 ? tramos : [{ desdeM: 0, hastaM: ejes.largoM, estilo: null, paso: null }];
    return lista.map((tramo) => ({
      tramo,
      puntos: perfil.filter((punto) => punto.distanciaM >= tramo.desdeM - 1e-6 && punto.distanciaM <= tramo.hastaM + 1e-6),
    }));
  }, [tramos, perfil, ejes.largoM]);

  const senalar = (distanciaM: number | null) => {
    const punto = distanciaM === null ? null : puntoMasCercano(perfil, distanciaM);
    setSenalado(punto);
    alSenalar?.(punto ? punto.distanciaM : null);
  };

  const alMover = (evento: PointerEvent<SVGSVGElement>) => {
    const caja = evento.currentTarget.getBoundingClientRect();
    const distanciaM = ((evento.clientX - caja.left - izquierda) / anchoUtil) * ejes.largoM;
    senalar(Math.min(ejes.largoM, Math.max(0, distanciaM)));
  };

  const alTeclear = (evento: KeyboardEvent<SVGSVGElement>) => {
    if (evento.key !== "ArrowLeft" && evento.key !== "ArrowRight") return;
    evento.preventDefault();
    const paso = ejes.largoM / 50;
    const desde = senalado?.distanciaM ?? 0;
    senalar(Math.min(ejes.largoM, Math.max(0, desde + (evento.key === "ArrowRight" ? paso : -paso))));
  };

  if (perfil.length < 2) return null;

  const area = `M${x(0)},${y(ejes.alturaMinimaM)} ${perfil.map((punto) => `L${x(punto.distanciaM)},${y(punto.alturaM)}`).join(" ")} L${x(ejes.largoM)},${y(ejes.alturaMinimaM)} Z`;
  const aqui = aquiM === null ? null : puntoMasCercano(perfil, aquiM);

  return (
    <div className="space-y-1">
      <p aria-live="polite" className={`${enNavegacion ? "text-lg" : "text-base"} min-h-6 font-semibold ${senalado ? "text-texto" : "text-texto-suave"}`}>
        {senalado
          ? `A ${textoDeDistancia(senalado.distanciaM)} del inicio · ${textoDeAltura(senalado.alturaM)} de altura`
          : "Pasá el dedo por el gráfico para ver cada altura."}
      </p>
      <div ref={contenedor} className="w-full">
        {ancho > 0 ? (
          <svg
            width={ancho}
            height={alto}
            viewBox={`0 0 ${ancho} ${alto}`}
            role="img"
            aria-label={descripcion}
            tabIndex={0}
            className="block cursor-crosshair touch-none select-none rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde"
            onPointerMove={alMover}
            onPointerDown={alMover}
            onPointerLeave={(evento) => { if (evento.pointerType === "mouse") senalar(null); }}
            onKeyDown={alTeclear}
          >
            {ejes.marcasDeAltura.map((altura) => (
              <g key={`a${altura}`}>
                <line x1={izquierda} x2={ancho - derecha} y1={y(altura)} y2={y(altura)} stroke="var(--borde)" strokeWidth={1} />
                <text x={izquierda - 6} y={y(altura) + letra * 0.35} textAnchor="end" fontSize={letra} fill="var(--texto-suave)">
                  {textoDeAltura(altura)}
                </text>
              </g>
            ))}
            {ejes.marcasDeDistancia.map((distancia, indice) => {
              const ultima = indice === ejes.marcasDeDistancia.length - 1 && x(distancia) > ancho - letra * 3;
              return (
                <text
                  key={`d${distancia}`}
                  x={x(distancia)}
                  y={alto - 4}
                  textAnchor={indice === 0 ? "start" : ultima ? "end" : "middle"}
                  fontSize={letra}
                  fill="var(--texto-suave)"
                >
                  {distancia === 0 ? "0 km" : textoDeDistancia(distancia)}
                </text>
              );
            })}

            <path d={area} fill="var(--superficie-alta)" />

            {pedazos.map(({ tramo, puntos }, indice) => puntos.length < 2 ? null : (
              <g key={`t${indice}`}>
                <polyline
                  points={puntos.map((punto) => `${x(punto.distanciaM)},${y(punto.alturaM)}`).join(" ")}
                  fill="none"
                  stroke={tramo.estilo ? COLOR[tramo.estilo] : "var(--texto)"}
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={trazoDe(tramo.paso)}
                />
                {tramo.paso === "sin_paso" ? puntos.filter((_, i) => i % Math.max(1, Math.round(puntos.length / 3)) === 0).map((punto) => (
                  <text
                    key={`x${punto.distanciaM}`}
                    x={x(punto.distanciaM)}
                    y={y(punto.alturaM) - 8}
                    textAnchor="middle"
                    fontSize={letra}
                    fontWeight={800}
                    fill="var(--parte-x)"
                    stroke="var(--parte-x-halo)"
                    strokeWidth={3}
                    paintOrder="stroke"
                  >
                    ✕
                  </text>
                )) : null}
              </g>
            ))}

            {aqui ? (
              <g>
                <line x1={x(aqui.distanciaM)} x2={x(aqui.distanciaM)} y1={arriba} y2={alto - abajo} stroke="var(--gps)" strokeWidth={2.5} />
                <circle cx={x(aqui.distanciaM)} cy={y(aqui.alturaM)} r={8} fill="var(--gps)" stroke="var(--superficie)" strokeWidth={3} />
                <text
                  x={x(aqui.distanciaM)}
                  y={arriba - 6}
                  textAnchor={x(aqui.distanciaM) > ancho - letra * 5 ? "end" : x(aqui.distanciaM) < izquierda + letra * 3 ? "start" : "middle"}
                  fontSize={letra}
                  fontWeight={800}
                  fill="var(--texto)"
                >
                  Estás acá
                </text>
              </g>
            ) : null}

            {senalado ? (
              <g pointerEvents="none">
                <line x1={x(senalado.distanciaM)} x2={x(senalado.distanciaM)} y1={arriba} y2={alto - abajo} stroke="var(--texto)" strokeWidth={1.5} strokeDasharray="4 4" />
                <circle cx={x(senalado.distanciaM)} cy={y(senalado.alturaM)} r={6} fill="var(--texto)" stroke="var(--superficie)" strokeWidth={3} />
              </g>
            ) : null}
          </svg>
        ) : (
          <div style={{ height: alto }} />
        )}
      </div>
    </div>
  );
}
