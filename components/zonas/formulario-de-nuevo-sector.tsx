"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { crearSector } from "@/app/actions/territorio";
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

export function FormularioDeNuevoSector({ zonaId }: NuevaSectorFormProps) {
  const router = useRouter();
  const { paquete, estado } = useDatosDeLaApp();

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

  // Mientras se abre no se muestra el formulario: sin la zona cargada no se
  // ven ni su nombre ni los sectores que ya existen, y el recuadro nuevo
  // parecería caer en un territorio vacío.
  if (estado === "abriendo") {
    return (
      <Tarjeta className="py-8 text-center text-base text-texto-suave">
        Abriendo la zona…
      </Tarjeta>
    );
  }

  if (!zona) {
    return (
      <Tarjeta franja="rojo" className="space-y-3">
        <p role="alert" className="text-base leading-6 text-rojo-texto">
          Esta zona no está en el celular, así que no se le pueden agregar
          sectores.
        </p>
        <p className="text-sm leading-6 text-texto-suave">
          Con conexión, volvé a la lista de zonas y se pone al día sola.
        </p>
        <BotonVolver destinoSiNoHayVuelta="/zonas" etiqueta="Volver a las zonas" />
      </Tarjeta>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BotonVolver
          destinoSiNoHayVuelta={`/zonas/${zonaId}`}
          etiqueta="Volver a la zona"
        />
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-texto">Nuevo sector</h1>
          <p className="truncate text-sm text-texto-suave">en {zona.nombre}</p>
        </div>
      </div>

      <CamposDeTerritorio
        queEs="sector"
        campos={campos}
        alCambiar={setCampos}
        rectangulosExistentes={hermanos.map((sector) => sector.rectangulo)}
      />

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
          {guardando ? "Guardando…" : "Guardar el sector"}
        </Boton>
      </div>
    </div>
  );
}
