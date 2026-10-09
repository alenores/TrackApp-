"use client";

import { AreaDeTexto } from "@/components/ui/area-de-texto";
import { Opciones, type Opcion } from "@/components/ui/opciones";
import { Tarjeta } from "@/components/ui/tarjeta";
import { mostrarEsfuerzo } from "@/lib/rutas/actividades";
import { LARGO_MAXIMO_DE_LOS_TEXTOS, type DatosDelCircuito } from "@/lib/circuitos/datos";
import { NIVELES_ESFUERZO, type NivelEsfuerzo } from "@/types/database";

/**
 * Lo que se carga a mano en un Circuito: técnica, esfuerzo, qué llevar,
 * complicaciones y comentario (decisión 049). Todo puede quedar sin cargar.
 * El largo y el desnivel no están acá: se calculan solos.
 */

const OPCIONES_DE_TECNICA: Opcion<number>[] = Array.from({ length: 10 }, (_, i) => ({ valor: i + 1, etiqueta: String(i + 1) }));
const OPCIONES_DE_ESFUERZO: Opcion<NivelEsfuerzo>[] = NIVELES_ESFUERZO.map((nivel) => ({ valor: nivel, etiqueta: mostrarEsfuerzo(nivel) }));

export function CamposDeDatosDelCircuito({ datos, alCambiar, deshabilitado = false }: {
  datos: DatosDelCircuito;
  /** Recibe solo lo que cambió: así dos cambios seguidos no se pisan. */
  alCambiar: (cambio: Partial<DatosDelCircuito>) => void;
  deshabilitado?: boolean;
}) {
  const cambiar = alCambiar;
  return (
    <Tarjeta className="space-y-4">
      <h2 className="text-xl font-bold text-texto">Datos del Circuito</h2>
      <p className="text-base text-texto-suave">El largo y el desnivel se calculan solos al guardar, con la línea del Circuito y el relieve del terreno.</p>
      <Opciones
        etiqueta="Técnica — cuánto hay que saber, del 1 al 10"
        opciones={OPCIONES_DE_TECNICA}
        elegidas={datos.tecnica === null ? [] : [datos.tecnica]}
        alElegir={(valor) => { if (!deshabilitado) cambiar({ tecnica: datos.tecnica === valor ? null : valor }); }}
        columnas={5}
      />
      <Opciones
        etiqueta="Esfuerzo — cuánto cansa"
        opciones={OPCIONES_DE_ESFUERZO}
        elegidas={datos.nivelEsfuerzo === null ? [] : [datos.nivelEsfuerzo]}
        alElegir={(valor) => { if (!deshabilitado) cambiar({ nivelEsfuerzo: datos.nivelEsfuerzo === valor ? null : valor }); }}
        columnas={4}
      />
      <AreaDeTexto
        label="Qué llevar"
        id="que-llevar-del-circuito"
        rows={2}
        maxLength={LARGO_MAXIMO_DE_LOS_TEXTOS}
        disabled={deshabilitado}
        value={datos.queLlevar ?? ""}
        onChange={(evento) => cambiar({ queLlevar: evento.target.value })}
        placeholder="Agua, abrigo, repuestos: lo que no puede faltar."
      />
      <AreaDeTexto
        label="Complicaciones"
        id="complicaciones-del-circuito"
        rows={2}
        maxLength={LARGO_MAXIMO_DE_LOS_TEXTOS}
        disabled={deshabilitado}
        value={datos.complicaciones ?? ""}
        onChange={(evento) => cambiar({ complicaciones: evento.target.value })}
        placeholder="Vados, tranqueras, tramos que se ponen feos."
      />
      <AreaDeTexto
        label="Comentario"
        id="comentario-del-circuito"
        rows={3}
        maxLength={LARGO_MAXIMO_DE_LOS_TEXTOS}
        disabled={deshabilitado}
        value={datos.comentario ?? ""}
        onChange={(evento) => cambiar({ comentario: evento.target.value })}
      />
    </Tarjeta>
  );
}
