"use client";

import type { ReactNode } from "react";
import { CampoDeCoordenada } from "@/components/ui/campo-de-coordenada";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Campo } from "@/components/ui/campo";
import { AreaDeTexto } from "@/components/ui/area-de-texto";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { mostrarPeso, pesoAproximadoDelMapa } from "@/lib/mapas/descarga";
import { leerCoordenada, type LecturaDeCoordenada } from "@/lib/coordenadas";
import {
  rectanguloDeLosCampos,
  type CamposDelTerritorio,
} from "@/lib/territorio/esquinas";
import { mostrarTamano } from "@/lib/territorio/tamano";
import type { Rectangulo } from "@/types/database";

/**
 * Los campos de una zona o de un sector.
 *
 * Los dos son lo mismo: un nombre y un pedazo de mapa marcado por dos esquinas.
 * Están en un solo archivo para que la regla de cómo se lee una coordenada
 * valga igual en los cuatro formularios.
 */

type CamposDeTerritorioProps = {
  /** «zona» o «sector», para que los textos hablen de lo que es. */
  queEs: "zona" | "sector";
  campos: CamposDelTerritorio;
  alCambiar: (campos: CamposDelTerritorio) => void;
  /** Los pedazos que ya existen, para ver dónde cae el nuevo. */
  rectangulosExistentes?: Rectangulo[];
  /**
   * Lo que va al final de la columna de los campos: el aviso de error y el
   * botón de guardar.
   *
   * Va acá y no suelto abajo porque en la computadora el mapa ocupa toda la
   * altura al costado: un botón debajo del mapa quedaría a dos pantallas de
   * scroll de los campos que acaba de llenar.
   */
  pie?: ReactNode;
};

export function CamposDeTerritorio({
  queEs,
  campos,
  alCambiar,
  rectangulosExistentes = [],
  pie,
}: CamposDeTerritorioProps) {
  const cambiar = (parcial: Partial<CamposDelTerritorio>) =>
    alCambiar({ ...campos, ...parcial });

  const lecturaNoroeste: LecturaDeCoordenada = leerCoordenada(campos.noroeste);
  const lecturaSudeste: LecturaDeCoordenada = leerCoordenada(campos.sudeste);
  const armado = rectanguloDeLosCampos(campos);

  return (
    /*
      En el celular, una columna: los campos y abajo el mapa, como siempre.
      En la computadora, dos: los campos a la izquierda con un ancho que se
      pueda leer, y el mapa a la derecha ocupando todo el alto, que es lo que
      de verdad hay que mirar antes de guardar.
    */
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start">
      <div className="space-y-3">
        <Tarjeta className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
            Cómo se llama
          </h2>

          <Campo
            label="Nombre"
            id={`nombre-de-la-${queEs}`}
            value={campos.nombre}
            onChange={(evento) => cambiar({ nombre: evento.target.value })}
            placeholder={
              queEs === "zona"
                ? "Sierras de Comechingones"
                : "Refugio Tabaquillo"
            }
            maxLength={120}
          />

          <AreaDeTexto
            label="Descripción"
            id={`descripcion-de-la-${queEs}`}
            rows={2}
            value={campos.descripcion}
            onChange={(evento) => cambiar({ descripcion: evento.target.value })}
            placeholder="Para qué sirve y qué abarca."
          />
        </Tarjeta>

        <Tarjeta className="space-y-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
              Las dos esquinas
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-texto-suave">
              {queEs === "zona"
                ? "Una zona es el territorio grande. Marcá sus dos esquinas y después la vas llenando de sectores."
                : "Un sector es el pedazo de mapa que se descarga de una vez. Marcá sus dos esquinas."}{" "}
              Pegá lo que tengas: el link de Google Maps, los números sueltos o
              los grados con minutos.
            </p>
          </div>

          <CampoDeCoordenada
            id={`esquina-noroeste-${queEs}`}
            etiqueta="Esquina de arriba a la izquierda (noroeste)"
            valor={campos.noroeste}
            lectura={lecturaNoroeste}
            alCambiar={(texto) => cambiar({ noroeste: texto })}
          />

          <CampoDeCoordenada
            id={`esquina-sudeste-${queEs}`}
            etiqueta="Esquina de abajo a la derecha (sudeste)"
            valor={campos.sudeste}
            lectura={lecturaSudeste}
            alCambiar={(texto) => cambiar({ sudeste: texto })}
          />

          {!armado.ok && armado.error ? (
            <div className="rounded-xl border border-rojo-borde bg-rojo-fondo px-3 py-3">
              <p role="alert" className="text-sm leading-6 text-rojo-texto">
                {armado.error}
              </p>
            </div>
          ) : null}

          {armado.ok ? (
            <div className="space-y-2 rounded-xl border border-borde-suave bg-fondo px-3 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-texto-suave">
                  Le da a {queEs === "zona" ? "la zona" : "el sector"}
                </span>
                <span className="text-base font-semibold tabular-nums text-texto">
                  {mostrarTamano(armado.rectangulo)}
                </span>
              </div>
              {queEs === "sector" ? (
                <p className="text-sm leading-6 text-texto-suave">
                  Su mapa va a pesar{" "}
                  <strong className="font-semibold text-dato">
                    {mostrarPeso(pesoAproximadoDelMapa(armado.rectangulo))}
                  </strong>{" "}
                  más o menos en el celular de cada uno.
                </p>
              ) : (
                <p className="text-sm leading-6 text-texto-suave">
                  El rectángulo de la zona no se descarga: sirve para ver qué
                  parte del territorio todavía no tiene sector encima. Lo que se
                  baja son los sectores.
                </p>
              )}
            </div>
          ) : null}
        </Tarjeta>

        {pie}
      </div>

      {armado.ok ? (
        <Tarjeta className="space-y-2 lg:sticky lg:top-0">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
            Dónde queda
          </h2>
          <CargadorDeMapa
            enVivo
            grande
            rectangulo={armado.rectangulo}
            rectangulosExistentes={rectangulosExistentes}
          />
          <p className="text-sm leading-6 text-texto-suave">
            Mirá que el recuadro caiga donde querés antes de guardar.
          </p>
        </Tarjeta>
      ) : null}
    </div>
  );
}
