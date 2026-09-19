"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { crearSector } from "@/app/actions/territorio";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { CamposDeTerritorio } from "@/components/zonas/campos-de-territorio";
import { BotonVolver } from "@/components/ui/boton-volver";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  rectanguloDeLosCampos,
  TERRITORIO_VACIO,
  type CamposDelTerritorio,
} from "@/lib/territorio/esquinas";

/**
 * Crear un sector.
 *
 * Un sector es **el pedazo de mapa que se descarga de una vez**. Por eso el
 * formulario muestra el recuadro sobre el mapa junto con los sectores que ya
 * existen: así se ve de una si quedó corrido o si pisa a otro.
 */

type NuevaSectorFormProps = {
  zonaId: number;
};

export function NuevaSectorForm({ zonaId }: NuevaSectorFormProps) {
  const router = useRouter();
  const { paquete } = useDatosDeLaApp();

  const [campos, setCampos] = useState<CamposDelTerritorio>(TERRITORIO_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const zona = paquete?.zonas.find((cada) => cada.id === zonaId) ?? null;
  const hermanos = (paquete?.sectores ?? []).filter(
    (sector) => sector.zonaId === zonaId,
  );

  const armado = rectanguloDeLosCampos(campos);

  const alGuardar = async () => {
    setError(null);

    if (!armado.ok) {
      setError(armado.error ?? "Completá las dos esquinas del sector.");
      return;
    }

    setGuardando(true);
    const resultado = await crearSector({
      zonaId,
      nombre: campos.nombre,
      descripcion: campos.descripcion || null,
      rectangulo: armado.rectangulo,
    });
    setGuardando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    router.push(`/zonas/${zonaId}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BotonVolver
          destinoSiNoHayVuelta={`/zonas/${zonaId}`}
          etiqueta="Volver a la zona"
        />
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-texto">Nuevo sector</h1>
          {zona ? (
            <p className="truncate text-sm text-texto-suave">en {zona.nombre}</p>
          ) : null}
        </div>
      </div>

      <CamposDeTerritorio
        queEs="sector"
        campos={campos}
        alCambiar={setCampos}
        rectangulosExistentes={hermanos.map((sector) => sector.rectangulo)}
      />

      {error ? (
        <Card franja="rojo">
          <p role="alert" className="text-sm leading-6 text-rojo-texto">
            {error}
          </p>
        </Card>
      ) : null}

      <div className="pb-2">
        <Button
          anchoCompleto
          paraNavegacion
          disabled={guardando || !armado.ok}
          onClick={() => void alGuardar()}
        >
          {guardando ? "Guardando…" : "Guardar el sector"}
        </Button>
      </div>
    </div>
  );
}
