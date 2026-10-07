import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { nombreDeComplejidad, nombreDelPaso } from "@/components/rutas/referencia-de-partes";
import { mostrarActividad } from "@/lib/rutas/actividades";
import type { CaminoGuardado } from "@/lib/caminos/datos";

type Propiedades = { camino: CaminoGuardado; indice: number; alCerrar: () => void };

export function FichaDeCamino({ camino, indice, alCerrar }: Propiedades) {
  const parte = camino.partes[indice];
  if (!parte) return null;

  return (
    <Tarjeta className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-bold text-texto">{camino.nombre}</h2>
        <Boton variante="fantasma" onClick={alCerrar} aria-label="Cerrar el detalle del Camino">Cerrar</Boton>
      </div>
      <p className="text-base text-texto-suave">Parte {indice + 1} de {camino.partes.length}</p>
      <div className="space-y-2">
        {camino.actividades.map((actividad) => {
          const datos = parte.porActividad[actividad];
          return datos ? (
            <p key={actividad} className="text-base text-texto">
              <strong>{mostrarActividad(actividad).etiqueta}:</strong> {nombreDelPaso(datos.paso, [actividad])} · {nombreDeComplejidad(datos.complejidad)}
            </p>
          ) : null;
        })}
      </div>
      {parte.observacion ? <p className="whitespace-pre-wrap text-base text-texto">{parte.observacion}</p> : null}
      {parte.comprobadoEl ? (
        <p className="text-base text-texto-suave">Comprobado el {new Date(`${parte.comprobadoEl}T12:00:00`).toLocaleDateString("es-AR")}</p>
      ) : null}
    </Tarjeta>
  );
}
