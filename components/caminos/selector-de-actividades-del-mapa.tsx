"use client";

import { useQuienSoy } from "@/components/armazon/quien-soy";
import { Pastilla } from "@/components/ui/pastilla";
import { InsigniaDeActividad } from "@/components/rutas/insignias-de-actividad";
import { ACTIVIDADES } from "@/lib/rutas/actividades";
import { ACTIVIDADES_RUTA } from "@/types/database";
import { alternarActividadDelMapa, type SeleccionDelMapa } from "@/lib/caminos/seleccion-del-mapa";

export function SelectorDeActividadesDelMapa({ seleccion, alCambiar }: {
  seleccion: SeleccionDelMapa;
  alCambiar: (seleccion: SeleccionDelMapa) => void;
}) {
  const { misActividades = [] } = useQuienSoy();
  const grupos = [{ titulo: "Tus actividades", actividades: ACTIVIDADES.filter((cada) => misActividades.includes(cada.tipo)) },
    { titulo: "Otras actividades", actividades: ACTIVIDADES.filter((cada) => !misActividades.includes(cada.tipo)) }];
  return <div className="space-y-3">
    <div role="group" aria-label="Actividades visibles" className="space-y-1.5">
      <p className="text-sm font-medium text-texto-suave">Mostrar actividades</p>
      <Pastilla etiqueta="Todas" prendida={seleccion.visibles.length === ACTIVIDADES_RUTA.length}
        alTocar={() => alCambiar({ visibles: [...ACTIVIDADES_RUTA], principal: seleccion.principal ?? ACTIVIDADES_RUTA[0] })} />
      {grupos.map((grupo) => <div key={grupo.titulo} role="group" aria-label={grupo.titulo} className="space-y-1.5">
        <p className="text-sm text-texto-suave">{grupo.titulo}</p>
        <div className="flex flex-wrap gap-1.5">
        {grupo.actividades.map((cada) => <button key={cada.tipo} type="button" role="checkbox"
          aria-checked={seleccion.visibles.includes(cada.tipo)}
          onClick={() => alCambiar(alternarActividadDelMapa(seleccion, cada.tipo))}
          className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-borde">
          <InsigniaDeActividad tipo={cada.tipo} tamano="mediano" apagada={!seleccion.visibles.includes(cada.tipo)} />
        </button>)}
        </div>
        {grupo.actividades.length === 0 ? <p className="text-sm text-texto-suave">{grupo.titulo === "Tus actividades" ? "Todavía no elegiste actividades en tu perfil." : "Ya elegiste todas las actividades en tu perfil."}</p> : null}
      </div>)}
    </div>
    {seleccion.visibles.length > 0 && <div role="radiogroup" aria-label="Actividad principal del mapa" className="space-y-1.5">
      <p className="text-sm font-medium text-texto-suave">Actividad principal</p>
      <div className="flex flex-wrap gap-1.5">
        {ACTIVIDADES.filter((cada) => seleccion.visibles.includes(cada.tipo)).map((cada) =>
          <Pastilla key={cada.tipo} rol="radio" etiqueta={cada.etiqueta} prendida={seleccion.principal === cada.tipo}
            alTocar={() => alCambiar({ ...seleccion, principal: cada.tipo })} />)}
      </div>
    </div>}
    {seleccion.visibles.length === 0 ? <p className="text-sm text-texto-suave">Elegí una o varias actividades, o Todas, para ver los Caminos.</p> : <p className="text-sm text-texto-suave">Los colores y la condición de paso corresponden a la actividad principal. Los demás Caminos se ven en gris.</p>}
  </div>;
}
