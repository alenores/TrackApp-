"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { crearZona } from "@/app/actions/territorio";
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

/** Crear una zona: el territorio grande que después se llena de sectores. */
export function FormularioDeNuevaZona() {
  const router = useRouter();
  const { paquete } = useDatosDeLaApp();

  const [campos, setCampos] = useState<CamposDelTerritorio>(TERRITORIO_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const armado = rectanguloDeLosCampos(campos);

  const alGuardar = async () => {
    setError(null);

    if (!armado.ok) {
      setError(armado.error ?? "Completá las dos esquinas de la zona.");
      return;
    }

    setGuardando(true);
    const resultado = await crearZona({
      nombre: campos.nombre,
      descripcion: campos.descripcion || null,
      rectangulo: armado.rectangulo,
    });
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

      <CamposDeTerritorio
        queEs="zona"
        campos={campos}
        alCambiar={setCampos}
        rectangulosExistentes={(paquete?.zonas ?? []).map(
          (zona) => zona.rectangulo,
        )}
        pie={
          <>
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
                disabled={guardando || !armado.ok}
                onClick={() => void alGuardar()}
              >
                {guardando ? "Guardando…" : "Guardar la zona"}
              </Boton>
            </div>
          </>
        }
      />
    </div>
  );
}
