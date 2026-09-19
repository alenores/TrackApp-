"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { borrarZona, editarZona } from "@/app/actions/territorio";
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

type EditarZonaFormProps = {
  zonaId: number;
  miPerfilId: string | null;
};

export function FormularioDeEditarZona({
  zonaId,
  miPerfilId,
}: EditarZonaFormProps) {
  const router = useRouter();
  const { paquete, estado } = useDatosDeLaApp();
  const { confirmar, avisar } = useDialogos();

  const [campos, setCampos] = useState<CamposDelTerritorio>(TERRITORIO_VACIO);
  const [semilla, setSemilla] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const zona = paquete?.zonas.find((cada) => cada.id === zonaId) ?? null;
  const sectoresDeLaZona = (paquete?.sectores ?? []).filter(
    (sector) => sector.zonaId === zonaId,
  );

  // Cuando aparece la zona guardada, se cargan los campos una sola vez.
  if (zona && semilla !== zona.id) {
    setSemilla(zona.id);
    setCampos(
      territorioDesdeRectangulo(zona.nombre, zona.descripcion, zona.rectangulo),
    );
  }

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
          Esta zona no está en el celular, así que no se puede editar.
        </p>
        <BotonVolver
          destinoSiNoHayVuelta="/zonas"
          etiqueta="Volver a las zonas"
        />
      </Tarjeta>
    );
  }

  if (miPerfilId !== zona.perfilId) {
    return (
      <Tarjeta franja="ambar" className="space-y-3">
        <p role="alert" className="text-base leading-6 text-ambar-texto">
          Esta zona la creó otra persona, así que no la podés editar.
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
      setError(armado.error ?? "Completá las dos esquinas de la zona.");
      return;
    }

    setGuardando(true);
    const resultado = await editarZona(zonaId, {
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
      titulo: `¿Borrar «${zona.nombre}»?`,
      mensaje:
        sectoresDeLaZona.length > 0
          ? `Se van a borrar también sus ${sectoresDeLaZona.length} sectores y las anotaciones que tengan adentro. Si te arrepentís, se puede recuperar.`
          : "La zona deja de verse en la app. Si te arrepentís, se puede recuperar.",
      textoDeAceptar: "Borrar",
      destructivo: true,
    });
    if (!seguro) return;

    setBorrando(true);
    const resultado = await borrarZona(zonaId);
    setBorrando(false);

    if (!resultado.ok) {
      await avisar({ titulo: "No se pudo borrar", mensaje: resultado.error });
      return;
    }

    router.push("/zonas");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BotonVolver
          destinoSiNoHayVuelta={`/zonas/${zonaId}`}
          etiqueta="Volver a la zona"
        />
        <h1 className="text-xl font-semibold text-texto">Editar la zona</h1>
      </div>

      <CamposDeTerritorio
        queEs="zona"
        campos={campos}
        alCambiar={setCampos}
        rectangulosExistentes={sectoresDeLaZona.map(
          (sector) => sector.rectangulo,
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
                {borrando ? "Borrando…" : "Borrar esta zona"}
              </Boton>
            </div>
          </>
        }
      />
    </div>
  );
}
