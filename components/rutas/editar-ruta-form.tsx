"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { borrarRuta, editarRuta } from "@/app/actions/rutas";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import {
  CamposDeRuta,
  CAMPOS_VACIOS,
  type CamposDeLaRuta,
} from "@/components/rutas/campos-de-ruta";
import { BotonVolver } from "@/components/ui/boton-volver";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDialogos } from "@/components/ui/dialogos";
import { mostrarDesnivel, mostrarLargo } from "@/lib/rutas/actividades";

/**
 * Editar una ruta.
 *
 * Se editan los datos que escribió una persona. **El largo y los desniveles no
 * se tocan**: salen del archivo y cambiarlos a mano sería inventar.
 */

type EditarRutaFormProps = {
  rutaId: number;
  miPerfilId: string | null;
};

export function EditarRutaForm({ rutaId, miPerfilId }: EditarRutaFormProps) {
  const router = useRouter();
  const { paquete, estado } = useDatosDeLaApp();
  const { confirmar, avisar } = useDialogos();

  const [campos, setCampos] = useState<CamposDeLaRuta>(CAMPOS_VACIOS);
  const [semilla, setSemilla] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ruta = paquete?.rutas.find((cada) => cada.id === rutaId) ?? null;

  // Cuando aparece la ruta guardada, se cargan los campos una sola vez. Va
  // durante el dibujado y no en un efecto: así el formulario nunca se ve vacío
  // un instante antes de llenarse.
  if (ruta && semilla !== ruta.id) {
    setSemilla(ruta.id);
    setCampos({
      nombre: ruta.nombre,
      descripcion: ruta.descripcion ?? "",
      actividades: ruta.actividades,
      dificultadTecnica: ruta.dificultadTecnica,
      nivelEsfuerzo: ruta.nivelEsfuerzo,
      equipo: ruta.equipo ?? "",
      complicaciones: ruta.complicaciones ?? "",
      comentario: ruta.comentario ?? "",
    });
  }

  if (estado === "abriendo") {
    return (
      <Card className="py-8 text-center text-base text-texto-suave">
        Abriendo la ruta…
      </Card>
    );
  }

  if (!ruta) {
    return (
      <Card franja="rojo" className="space-y-3">
        <p role="alert" className="text-base leading-6 text-rojo-texto">
          Esta ruta no está en el celular, así que no se puede editar.
        </p>
        <BotonVolver destinoSiNoHayVuelta="/rutas" etiqueta="Volver a las rutas" />
      </Card>
    );
  }

  if (miPerfilId !== ruta.perfilId) {
    return (
      <Card franja="ambar" className="space-y-3">
        <p role="alert" className="text-base leading-6 text-ambar-texto">
          Esta ruta la subió otra persona, así que no la podés editar.
        </p>
        <BotonVolver
          destinoSiNoHayVuelta={`/rutas/${rutaId}`}
          etiqueta="Volver a la ruta"
        />
      </Card>
    );
  }

  const alGuardar = async () => {
    setError(null);
    setGuardando(true);

    const resultado = await editarRuta(rutaId, {
      nombre: campos.nombre,
      descripcion: campos.descripcion || null,
      comentario: campos.comentario || null,
      actividades: campos.actividades,
      dificultadTecnica: campos.dificultadTecnica,
      nivelEsfuerzo: campos.nivelEsfuerzo,
      equipo: campos.equipo || null,
      complicaciones: campos.complicaciones || null,
    });

    setGuardando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    router.push(`/rutas/${rutaId}`);
  };

  const alBorrar = async () => {
    const seguro = await confirmar({
      titulo: `¿Borrar «${ruta.nombre}»?`,
      mensaje:
        "La ruta deja de verse en la app. Si te arrepentís, se puede recuperar.",
      textoDeAceptar: "Borrar",
      destructivo: true,
    });
    if (!seguro) return;

    setBorrando(true);
    const resultado = await borrarRuta(rutaId);
    setBorrando(false);

    if (!resultado.ok) {
      await avisar({ titulo: "No se pudo borrar", mensaje: resultado.error });
      return;
    }

    router.push("/rutas");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BotonVolver
          destinoSiNoHayVuelta={`/rutas/${rutaId}`}
          etiqueta="Volver a la ruta"
        />
        <h1 className="text-xl font-semibold text-texto">Editar la ruta</h1>
      </div>

      <Card className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
          Lo que sale del archivo
        </h2>
        <p className="text-sm leading-6 text-texto-suave">
          Estos números no se editan: los sacó la app del recorrido. Para
          cambiarlos hay que subir la ruta de nuevo con otro archivo.
        </p>
        <dl className="grid grid-cols-3 gap-3 rounded-xl border border-borde-suave bg-fondo px-3 py-3">
          <div>
            <dt className="text-xs text-texto-suave">Largo</dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums text-dato">
              {mostrarLargo(ruta.largoKm)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-texto-suave">Se sube</dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums text-texto">
              {mostrarDesnivel(ruta.desnivelPositivoM, "positivo")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-texto-suave">Se baja</dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums text-texto">
              {mostrarDesnivel(ruta.desnivelNegativoM, "negativo")}
            </dd>
          </div>
        </dl>
      </Card>

      <CamposDeRuta campos={campos} alCambiar={setCampos} />

      {error ? (
        <Card franja="rojo">
          <p role="alert" className="text-sm leading-6 text-rojo-texto">
            {error}
          </p>
        </Card>
      ) : null}

      <Button
        anchoCompleto
        paraNavegacion
        disabled={guardando}
        onClick={() => void alGuardar()}
      >
        {guardando ? "Guardando…" : "Guardar los cambios"}
      </Button>

      <div className="pb-2">
        <Button
          anchoCompleto
          variante="destructivo"
          disabled={borrando}
          onClick={() => void alBorrar()}
        >
          {borrando ? "Borrando…" : "Borrar esta ruta"}
        </Button>
      </div>
    </div>
  );
}
