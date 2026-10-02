"use client";

import { useState } from "react";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";
import { AreaDeTexto } from "@/components/ui/area-de-texto";
import { Opciones } from "@/components/ui/opciones";
import { SelectorDeFoto } from "@/components/fotos/selector-de-foto";
import { useFoto } from "@/hooks/use-foto";
import { FORMAS_DE_RECORTE } from "@/components/fotos/recorte-de-foto";
import { registrarSalida } from "@/app/actions/salidas";
import { useDialogos } from "@/components/ui/dialogos";
import { CruzRedonda } from "@/components/ui/cruz-redonda";
import { Avatar } from "@/components/ui/avatar";
import { ACTIVIDADES } from "@/lib/rutas/actividades";
import type { Perfil } from "@/types/database";

type Props = {
  perfiles: Perfil[];
  alTerminar: () => void;
  alCancelar: () => void;
};

const OPCIONES_ACTIVIDADES = ACTIVIDADES.map((a) => ({
  valor: a.tipo,
  etiqueta: a.etiqueta,
  trazo: a.trazo,
}));

const OPCIONES_DIFICULTAD = [
  { valor: "Fácil", etiqueta: "Fácil" },
  { valor: "Moderado", etiqueta: "Moderado" },
  { valor: "Difícil", etiqueta: "Difícil" },
  { valor: "Extremo", etiqueta: "Extremo" },
];

export function FormularioDeSalida({ perfiles, alTerminar, alCancelar }: Props) {
  const { avisar } = useDialogos();
  const foto1 = useFoto("salida", FORMAS_DE_RECORTE.salida);
  const foto2 = useFoto("salida", FORMAS_DE_RECORTE.salida);
  const foto3 = useFoto("salida", FORMAS_DE_RECORTE.salida);
  const foto4 = useFoto("salida", FORMAS_DE_RECORTE.salida);
  
  const [guardando, setGuardando] = useState(false);
  const [actividades, setActividades] = useState<string[]>([]);
  const [dificultad, setDificultad] = useState<string[]>([]);
  const [amigosSeleccionados, setAmigosSeleccionados] = useState<string[]>([]);
  
  const alAlternarActividad = (valor: string) => {
    setActividades((prev) =>
      prev.includes(valor) ? prev.filter((v) => v !== valor) : [...prev, valor]
    );
  };

  const alAlternarAmigo = (id: string) => {
    setAmigosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const alElegirDificultad = (valor: string) => {
    setDificultad([valor]);
  };

  const manejarEnvio = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (actividades.length === 0) {
      await avisar({ titulo: "Falta un dato", mensaje: "Por favor elegí al menos un tipo de actividad." });
      return;
    }

    setGuardando(true);
    const form = new FormData(evento.currentTarget);
    
    // Adjuntar los arrays
    form.set("actividades", JSON.stringify(actividades));
    form.set("amigos", JSON.stringify(amigosSeleccionados));
    if (dificultad.length > 0) form.set("dificultad", dificultad[0]);
    
    // Adjuntar foto lista si la hay
    if (foto1.archivo) form.set("foto1", foto1.archivo);
    if (foto2.archivo) form.set("foto2", foto2.archivo);
    if (foto3.archivo) form.set("foto3", foto3.archivo);
    if (foto4.archivo) form.set("foto4", foto4.archivo);

    const resultado = await registrarSalida(form);
    setGuardando(false);

    if (!resultado.ok) {
      await avisar({ titulo: "No se pudo registrar", mensaje: resultado.error });
      return;
    }

    alTerminar();
  };

  return (
    <form onSubmit={manejarEnvio} className="relative space-y-6">
      <div className="absolute right-0 top-0">
        <button
          type="button"
          onClick={alCancelar}
          className="p-2 text-texto-suave hover:text-texto"
        >
          <CruzRedonda />
        </button>
      </div>
      <div className="space-y-6 pt-6">
        
        <Campo
          label="Título"
          name="titulo"
          type="text"
          placeholder="Ej: Salida al cerro..."
          required
        />

        <Opciones
          titulo="campo"
          etiqueta="Tipo de actividad (Obligatorio)"
          ayuda="Podés elegir varias"
          opciones={OPCIONES_ACTIVIDADES}
          elegidas={actividades}
          alElegir={alAlternarActividad}
          multiple
          columnas={2}
        />

        <div className="grid grid-cols-2 gap-4">
          <Campo
            label="Kilómetros"
            name="kilometros"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ej: 15.5"
          />
          <Opciones
            titulo="campo"
            etiqueta="Dificultad"
            opciones={OPCIONES_DIFICULTAD}
            elegidas={dificultad}
            alElegir={alElegirDificultad}
            columnas={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Campo
            label="Metros subidos"
            name="metrosSubidos"
            type="number"
            min="0"
            placeholder="Ej: 800"
          />
          <Campo
            label="Metros bajados"
            name="metrosBajados"
            type="number"
            min="0"
            placeholder="Ej: 800"
          />
        </div>

        <AreaDeTexto
          label="Descripción"
          name="descripcion"
          rows={3}
          placeholder="¿Cómo estuvo la salida? Contá detalles..."
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-texto-suave">
            Archivo GPS (Opcional)
          </label>
          <input
            type="file"
            name="trackArchivo"
            accept=".gpx,.kml,.kmz"
            className="block w-full text-sm text-texto-suave file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-superficie file:text-texto hover:file:bg-borde-suave cursor-pointer"
          />
        </div>

        <div>
          <p className="block text-sm font-medium text-texto-suave mb-2">Fotos de la salida</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <SelectorDeFoto foto={foto1} deshabilitado={guardando} etiqueta="Elegir Portada" />
            </div>
            <SelectorDeFoto foto={foto2} deshabilitado={guardando} etiqueta="Foto del álbum 1" />
            <SelectorDeFoto foto={foto3} deshabilitado={guardando} etiqueta="Foto del álbum 2" />
            <SelectorDeFoto foto={foto4} deshabilitado={guardando} etiqueta="Foto del álbum 3" />
          </div>
        </div>

        <div>
          <p className="block text-sm font-medium text-texto-suave mb-2">Etiquetar amigos</p>
          <div className="flex flex-wrap gap-2">
            {perfiles.map(p => {
              const seleccionado = amigosSeleccionados.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => alAlternarAmigo(p.id)}
                  className={[
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 transition-colors",
                    seleccionado ? "border-acento bg-acento/10 text-acento" : "border-borde hover:border-acento-borde"
                  ].join(" ")}
                >
                  <Avatar src={p.avatarUrl} name={p.nombre || "U"} size="sm" />
                  <span className="text-sm">{p.nombre}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      <div className="flex pt-2">
        <Boton
          type="submit"
          variante="principal"
          className="flex-1"
          disabled={guardando}
        >
          {guardando ? "Guardando…" : "Registrar"}
        </Boton>
      </div>
    </form>
  );
}
