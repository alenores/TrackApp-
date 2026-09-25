"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { borrarZona, editarZona } from "@/app/actions/territorio";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { BotonVolver } from "@/components/ui/boton-volver";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useDialogos } from "@/components/ui/dialogos";
import { Campo } from "@/components/ui/campo";
import { AreaDeTexto } from "@/components/ui/area-de-texto";

import { useFoto } from "@/hooks/use-foto";
import { FORMAS_DE_RECORTE } from "@/components/fotos/recorte-de-foto";
import { SelectorDeFoto } from "@/components/fotos/selector-de-foto";
import { ponerAlDiaDespuesDeGuardar } from "@/lib/offline/puesta-al-dia";

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

  const fotoZona = useFoto("zona", FORMAS_DE_RECORTE.zona);
  
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [cargado, setCargado] = useState(false);
  
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const zona = paquete?.zonas.find((cada) => cada.id === zonaId) ?? null;
  const sectoresDeLaZona = (paquete?.sectores ?? []).filter(
    (sector) => sector.zonaId === zonaId,
  );

  // Se llena una sola vez, cuando la zona aparece en el paquete.
  if (zona && !cargado) {
    setNombre(zona.nombre);
    setDescripcion(zona.descripcion ?? "");
    setCargado(true);
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

  const alGuardar = async () => {
    setError(null);

    if (!nombre.trim()) {
      setError("Ponele un nombre a la zona.");
      return;
    }

    setGuardando(true);
    const resultado = await editarZona(zonaId, {
      nombre: nombre,
      descripcion: descripcion || null,
      rectangulo: zona.rectangulo,
      fotoFile: fotoZona.archivo,
    });
    setGuardando(false);

    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }

    // Lo que acabás de guardar tiene que aparecer ya, sin cerrar la app.
    void ponerAlDiaDespuesDeGuardar();
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

    // Lo que acabás de guardar tiene que aparecer ya, sin cerrar la app.
    void ponerAlDiaDespuesDeGuardar();
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

      <Tarjeta className="space-y-5">
        <Campo
          label="Nombre"
          id="nombre-de-la-zona"
          type="text"
          value={nombre}
          onChange={(evento) => setNombre(evento.target.value)}
          placeholder="Ej: Sierras Grandes"
          maxLength={120}
        />

        <AreaDeTexto
          label="Descripción"
          id="descripcion-de-la-zona"
          rows={2}
          value={descripcion}
          onChange={(evento) => setDescripcion(evento.target.value)}
          placeholder="Para qué sirve y qué abarca."
        />

        <div className="space-y-2 pt-1">
          <p className="text-sm font-medium text-texto-suave">Foto de la zona</p>
          <SelectorDeFoto
            foto={fotoZona}
            etiqueta="Elegir foto de la zona"
            fotoActual={zona.fotoUrl}
          />
        </div>
      </Tarjeta>

      <div className="space-y-3">
        {error ? (
          <Tarjeta franja="rojo">
            <p role="alert" className="text-sm leading-6 text-rojo-texto">
              {error}
            </p>
          </Tarjeta>
        ) : null}

        <Boton
          anchoCompleto
          disabled={guardando || !nombre.trim()}
          onClick={() => void alGuardar()}
        >
          {guardando ? "Guardando…" : "Guardar los cambios"}
        </Boton>

        <Boton
          anchoCompleto
          variante="destructivo"
          disabled={borrando}
          onClick={() => void alBorrar()}
        >
          {borrando ? "Borrando…" : "Borrar esta zona"}
        </Boton>
      </div>
    </div>
  );
}
