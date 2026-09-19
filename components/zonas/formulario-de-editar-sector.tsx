"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { borrarSector, editarSector } from "@/app/actions/territorio";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { CamposDeTerritorio } from "@/components/zonas/campos-de-territorio";
import { BotonVolver } from "@/components/ui/boton-volver";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useDialogos } from "@/components/ui/dialogos";
import {
  rectanguloDeLosCampos,
  territorioDesdeRectangulo,
  TERRITORIO_VACIO,
  type CamposDelTerritorio,
} from "@/lib/territorio/esquinas";

type EditarSectorFormProps = {
  zonaId: number;
  sectorId: number;
  miPerfilId: string | null;
};

export function FormularioDeEditarSector({
  zonaId,
  sectorId,
  miPerfilId,
}: EditarSectorFormProps) {
  const router = useRouter();
  const { paquete, estado } = useDatosDeLaApp();
  const { confirmar, avisar } = useDialogos();

  const [campos, setCampos] = useState<CamposDelTerritorio>(TERRITORIO_VACIO);
  const [semilla, setSemilla] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sector = paquete?.sectores.find((cada) => cada.id === sectorId) ?? null;
  const hermanos = (paquete?.sectores ?? []).filter(
    (cada) => cada.zonaId === zonaId && cada.id !== sectorId,
  );
  const anotacionesDentro = (paquete?.anotaciones ?? []).filter(
    (anotacion) => anotacion.sectorId === sectorId,
  );

  // Cuando aparece el sector guardado, se cargan los campos una sola vez.
  if (sector && semilla !== sector.id) {
    setSemilla(sector.id);
    setCampos(
      territorioDesdeRectangulo(
        sector.nombre,
        sector.descripcion,
        sector.rectangulo,
      ),
    );
  }

  if (estado === "abriendo") {
    return (
      <Tarjeta className="py-8 text-center text-base text-texto-suave">
        Abriendo el sector…
      </Tarjeta>
    );
  }

  if (!sector) {
    return (
      <Tarjeta franja="rojo" className="space-y-3">
        <p role="alert" className="text-base leading-6 text-rojo-texto">
          Este sector no está en el celular, así que no se puede editar.
        </p>
        <BotonVolver
          destinoSiNoHayVuelta={`/zonas/${zonaId}`}
          etiqueta="Volver a la zona"
        />
      </Tarjeta>
    );
  }

  if (miPerfilId !== sector.perfilId) {
    return (
      <Tarjeta franja="ambar" className="space-y-3">
        <p role="alert" className="text-base leading-6 text-ambar-texto">
          Este sector lo creó otra persona, así que no lo podés editar.
        </p>
        <BotonVolver
          destinoSiNoHayVuelta={`/zonas/${zonaId}`}
          etiqueta="Volver a la zona"
        />
      </Tarjeta>
    );
  }

  const armado = rectanguloDeLosCampos(campos);

  const alGuardar = async () => {
    setError(null);

    if (!armado.ok) {
      setError(armado.error ?? "Completá las dos esquinas del sector.");
      return;
    }

    setGuardando(true);
    const resultado = await editarSector(sectorId, {
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

  const alBorrar = async () => {
    const seguro = await confirmar({
      titulo: `¿Borrar «${sector.nombre}»?`,
      mensaje:
        anotacionesDentro.length > 0
          ? `Se van a borrar también sus ${anotacionesDentro.length} anotaciones. Si te arrepentís, se puede recuperar.`
          : "El sector deja de verse en la app. Si te arrepentís, se puede recuperar.",
      textoDeAceptar: "Borrar",
      destructivo: true,
    });
    if (!seguro) return;

    setBorrando(true);
    const resultado = await borrarSector(sectorId);
    setBorrando(false);

    if (!resultado.ok) {
      await avisar({ titulo: "No se pudo borrar", mensaje: resultado.error });
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
        <h1 className="text-xl font-semibold text-texto">Editar el sector</h1>
      </div>

      <CamposDeTerritorio
        queEs="sector"
        campos={campos}
        alCambiar={setCampos}
        rectangulosExistentes={hermanos.map((cada) => cada.rectangulo)}
        pie={
          <>
            {error ? (
              <Tarjeta franja="rojo">
                <p role="alert" className="text-sm leading-6 text-rojo-texto">
                  {error}
                </p>
              </Tarjeta>
            ) : null}

            <Boton
              anchoCompleto
              paraNavegacion
              disabled={guardando || !armado.ok}
              onClick={() => void alGuardar()}
            >
              {guardando ? "Guardando…" : "Guardar los cambios"}
            </Boton>

            <div className="pb-2">
              <Boton
                anchoCompleto
                variante="destructivo"
                disabled={borrando}
                onClick={() => void alBorrar()}
              >
                {borrando ? "Borrando…" : "Borrar este sector"}
              </Boton>
            </div>
          </>
        }
      />
    </div>
  );
}
