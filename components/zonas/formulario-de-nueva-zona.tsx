"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Enlace } from "@/components/ui/enlace";
import { crearZonaConSectores } from "@/app/actions/territorio";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { CamposDeTerritorio } from "@/components/zonas/campos-de-territorio";
import { BotonVolver } from "@/components/ui/boton-volver";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import {
  rectanguloDeLosCampos,
  TERRITORIO_VACIO,
  type CamposDelTerritorio,
} from "@/lib/territorio/esquinas";
import { calcularCuadricula } from "@/lib/territorio/fraccionamiento";
import type { Rectangulo } from "@/types/database";

import { estimarPesoEnMB, UMBRAL_DE_RIESGO_MB, mostrarTamano } from "@/lib/territorio/tamano";

import { useFoto } from "@/hooks/use-foto";
import { FORMAS_DE_RECORTE } from "@/components/fotos/recorte-de-foto";

/** Crear una zona: el territorio grande que después se llena de sectores. */
export function FormularioDeNuevaZona() {
  const router = useRouter();
  const { paquete } = useDatosDeLaApp();

  const searchParams = useSearchParams();
  const fotoZona = useFoto("zona", FORMAS_DE_RECORTE.zona);
  
  const [campos, setCampos] = useState<CamposDelTerritorio>(() => {
    const latNorte = searchParams.get("latNorte");
    const latSur = searchParams.get("latSur");
    const lonEste = searchParams.get("lonEste");
    const lonOeste = searchParams.get("lonOeste");

    if (latNorte && latSur && lonEste && lonOeste) {
      return {
        ...TERRITORIO_VACIO,
        latNorte,
        latSur,
        lonEste,
        lonOeste,
      };
    }
    return TERRITORIO_VACIO;
  });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seleccion, setSeleccion] = useState<{ filas: number; columnas: number } | null>(null);
  const [previsualizacion, setPrevisualizacion] = useState<Rectangulo[]>([]);

  const armado = rectanguloDeLosCampos(campos);

  const alGuardar = async () => {
    setError(null);

    if (!armado.ok) {
      setError(armado.error ?? "Completá las dos esquinas de la zona.");
      return;
    }
    
    if (!seleccion) {
      setError("Tenés que elegir cómo fraccionar la zona en sectores.");
      return;
    }

    setGuardando(true);
    const resultado = await crearZonaConSectores(
      {
        nombre: campos.nombre,
        descripcion: campos.descripcion || null,
        rectangulo: armado.rectangulo,
        fotoFile: fotoZona.archivo,
      },
      seleccion
    );
    setGuardando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    router.push(`/zonas/${resultado.datos.zonaId}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BotonVolver
          destinoSiNoHayVuelta="/zonas"
          etiqueta="Volver a las zonas"
        />
        <h1 className="text-xl font-semibold text-texto">Nueva zona</h1>
      </div>

      <div className="flex flex-col gap-3">
        <Tarjeta>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-texto mb-1">Dibujar en el mapa</h2>
              <p className="text-sm text-texto-suave">
                Marcá el rectángulo arrastrando en el mapa. Se ajustará exacto a los bordes de otras zonas para no dejar huecos.
              </p>
            </div>
            <Enlace
              href="/zonas/dibujar"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-acento px-4 font-semibold text-acento-texto transition-colors hover:bg-acento-hover"
            >
              Ir al mapa
            </Enlace>
          </div>
        </Tarjeta>

        <CamposDeTerritorio
        queEs="zona"
        campos={campos}
        fotoZona={fotoZona}
        alCambiar={(nuevos) => {
          setCampos(nuevos);
          const nuevoArmado = rectanguloDeLosCampos(nuevos);
          if (nuevoArmado.ok && seleccion) {
            const cuadricula = calcularCuadricula(nuevoArmado.rectangulo, seleccion.filas, seleccion.columnas);
            setPrevisualizacion(cuadricula.map((c) => c.rectangulo));
          } else {
            setPrevisualizacion([]);
          }
        }}
        rectangulosExistentes={(paquete?.zonas ?? []).map((zona) => zona.rectangulo)}
        rectangulosExtra={previsualizacion.map((r) => ({ rectangulo: r, clase: "nuevo" } as const))}
        pie={
          <>
            {armado.ok ? (() => {
              const haySeleccion = seleccion && seleccion.filas > 0 && seleccion.columnas > 0;
              const cuadricula = haySeleccion ? calcularCuadricula(armado.rectangulo, seleccion.filas, seleccion.columnas) : [];
              const sectorEjemplo = cuadricula[0]?.rectangulo;
              const peso = sectorEjemplo ? estimarPesoEnMB(sectorEjemplo) : 0;
              const enRiesgo = peso > UMBRAL_DE_RIESGO_MB;

              return (
                <Tarjeta franja={haySeleccion && enRiesgo ? "rojo" : "ambar"} className="space-y-4">
                  <div>
                    <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave mb-1">
                      Fraccionar en Sectores
                    </h2>
                    <p className="text-sm leading-6 text-texto-suave">
                      Elegí cómo dividirla para generar las partes descargables automáticamente.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1 space-y-1">
                      <label className="text-sm font-medium text-texto">Filas</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={seleccion?.filas || ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const nuevasCols = seleccion?.columnas || 0;
                          setSeleccion({ filas: val, columnas: nuevasCols });
                          
                          if (val > 0 && nuevasCols > 0) {
                            const nuevaC = calcularCuadricula(armado.rectangulo, val, nuevasCols);
                            setPrevisualizacion(nuevaC.map(c => c.rectangulo));
                          } else {
                            setPrevisualizacion([]);
                          }
                        }}
                        className="w-full rounded-md border border-borde bg-superficie px-3 py-2 text-texto"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-sm font-medium text-texto">Columnas</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={seleccion?.columnas || ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const nuevasFilas = seleccion?.filas || 0;
                          setSeleccion({ filas: nuevasFilas, columnas: val });
                          
                          if (nuevasFilas > 0 && val > 0) {
                            const nuevaC = calcularCuadricula(armado.rectangulo, nuevasFilas, val);
                            setPrevisualizacion(nuevaC.map(c => c.rectangulo));
                          } else {
                            setPrevisualizacion([]);
                          }
                        }}
                        className="w-full rounded-md border border-borde bg-superficie px-3 py-2 text-texto"
                      />
                    </div>
                  </div>

                  {haySeleccion && sectorEjemplo ? (
                    <div className={`rounded-md p-3 text-sm ${enRiesgo ? 'bg-rojo-fondo text-rojo-texto' : 'bg-superficie-alta text-texto-suave'}`}>
                      <p>Cada sector medirá aprox: <strong>{mostrarTamano(sectorEjemplo)}</strong>.</p>
                      <p>Peso estimado de descarga: <strong>{peso} MB</strong>.</p>
                      {enRiesgo && (
                        <p className="mt-1 font-semibold">
                          ⚠️ Este sector es muy pesado. Dividí la zona en más filas o columnas para achicarlo.
                        </p>
                      )}
                    </div>
                  ) : null}
                </Tarjeta>
              );
            })() : null}
            {error ? (
              <Tarjeta franja="rojo">
                <p role="alert" className="text-sm leading-6 text-rojo-texto">
                  {error}
                </p>
              </Tarjeta>
            ) : null}

            <div className="pb-2">
              <Boton
                anchoCompleto
                paraNavegacion
                disabled={guardando || !armado.ok || !seleccion}
                onClick={() => void alGuardar()}
              >
                {guardando ? "Guardando…" : "Guardar"}
              </Boton>
            </div>
          </>
        }
      />
      </div>
    </div>
  );
}
