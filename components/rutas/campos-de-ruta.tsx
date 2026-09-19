"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AreaDeTexto } from "@/components/ui/area-de-texto";
import { Opciones, type Opcion } from "@/components/ui/opciones";
import { ACTIVIDADES, mostrarEsfuerzo } from "@/lib/rutas/actividades";
import {
  ACTIVIDADES_RUTA,
  NIVELES_ESFUERZO,
  type ActividadRuta,
  type NivelEsfuerzo,
} from "@/types/database";

/**
 * Los campos de una ruta, los mismos al subirla y al editarla.
 *
 * Están en un solo lugar para que agregar un dato nuevo no obligue a acordarse
 * de tocar dos formularios.
 */

export type CamposDeLaRuta = {
  nombre: string;
  descripcion: string;
  actividades: ActividadRuta[];
  dificultadTecnica: number | null;
  nivelEsfuerzo: NivelEsfuerzo | null;
  equipo: string;
  complicaciones: string;
  comentario: string;
};

export const CAMPOS_VACIOS: CamposDeLaRuta = {
  nombre: "",
  descripcion: "",
  actividades: [],
  dificultadTecnica: null,
  nivelEsfuerzo: null,
  equipo: "",
  complicaciones: "",
  comentario: "",
};

const OPCIONES_DE_ACTIVIDAD: Opcion<ActividadRuta>[] = ACTIVIDADES_RUTA.map(
  (tipo) => {
    const actividad = ACTIVIDADES.find((cada) => cada.tipo === tipo);
    return {
      valor: tipo,
      etiqueta: actividad?.etiqueta ?? tipo,
      trazo: actividad?.trazo,
    };
  },
);

const OPCIONES_DE_DIFICULTAD: Opcion<number>[] = Array.from(
  { length: 10 },
  (_, i) => ({ valor: i + 1, etiqueta: String(i + 1) }),
);

const OPCIONES_DE_ESFUERZO: Opcion<NivelEsfuerzo>[] = NIVELES_ESFUERZO.map(
  (nivel) => ({ valor: nivel, etiqueta: mostrarEsfuerzo(nivel) }),
);

type CamposDeRutaProps = {
  campos: CamposDeLaRuta;
  alCambiar: (campos: CamposDeLaRuta) => void;
  deshabilitado?: boolean;
};

export function CamposDeRuta({ campos, alCambiar }: CamposDeRutaProps) {
  const cambiar = (parcial: Partial<CamposDeLaRuta>) =>
    alCambiar({ ...campos, ...parcial });

  const alternarActividad = (tipo: ActividadRuta) => {
    const yaEsta = campos.actividades.includes(tipo);
    cambiar({
      actividades: yaEsta
        ? campos.actividades.filter((cada) => cada !== tipo)
        : [...campos.actividades, tipo],
    });
  };

  return (
    <>
      <Card className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
          Cómo se llama
        </h2>

        <Input
          label="Nombre"
          id="nombre-de-la-ruta"
          value={campos.nombre}
          onChange={(evento) => cambiar({ nombre: evento.target.value })}
          placeholder="Cerro Champaquí desde Villa Alpina"
          maxLength={120}
        />

        <AreaDeTexto
          label="Descripción"
          id="descripcion-de-la-ruta"
          value={campos.descripcion}
          onChange={(evento) => cambiar({ descripcion: evento.target.value })}
          placeholder="En dos líneas: por dónde va y qué esperar."
        />
      </Card>

      <Card>
        <Opciones
          etiqueta="Para qué sirve"
          opciones={OPCIONES_DE_ACTIVIDAD}
          elegidas={campos.actividades}
          alElegir={alternarActividad}
          columnas={2}
          multiple
        />
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
          Qué tan exigente es
        </h2>

        <Opciones
          etiqueta="Dificultad técnica — cuánto hay que saber"
          opciones={OPCIONES_DE_DIFICULTAD}
          elegidas={campos.dificultadTecnica === null ? [] : [campos.dificultadTecnica]}
          alElegir={(valor) =>
            cambiar({
              dificultadTecnica: campos.dificultadTecnica === valor ? null : valor,
            })
          }
          columnas={5}
        />

        <Opciones
          etiqueta="Esfuerzo — cuánto cansa"
          opciones={OPCIONES_DE_ESFUERZO}
          elegidas={campos.nivelEsfuerzo === null ? [] : [campos.nivelEsfuerzo]}
          alElegir={(valor) =>
            cambiar({
              nivelEsfuerzo: campos.nivelEsfuerzo === valor ? null : valor,
            })
          }
          columnas={4}
        />
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
          Lo que conviene saber antes
        </h2>

        <AreaDeTexto
          label="Qué llevar"
          id="equipo-de-la-ruta"
          rows={2}
          value={campos.equipo}
          onChange={(evento) => cambiar({ equipo: evento.target.value })}
          placeholder="Agua, abrigo, lo que no puede faltar."
        />

        <AreaDeTexto
          label="Complicaciones"
          id="complicaciones-de-la-ruta"
          rows={2}
          value={campos.complicaciones}
          onChange={(evento) => cambiar({ complicaciones: evento.target.value })}
          placeholder="Vados, piedra suelta, tramos que se ponen feos."
        />

        <AreaDeTexto
          label="Comentario"
          id="comentario-de-la-ruta"
          rows={2}
          value={campos.comentario}
          onChange={(evento) => cambiar({ comentario: evento.target.value })}
          placeholder="Cuándo la hiciste, con quién, cuánto tardaste."
        />
      </Card>
    </>
  );
}
