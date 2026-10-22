import type { ReactNode } from "react";

/**
 * **Un mapa y su panel**, para las pantallas donde se dibuja, se carga o se
 * edita sobre el mapa.
 *
 * En la computadora la página no se desliza: el título queda arriba, el mapa
 * ocupa todo el alto que queda y no se mueve, y el panel se desliza solo él
 * cuando es más largo que la pantalla. Lo que va arriba de esta pieza —el
 * título, un aviso— conserva su alto y la pieza toma el resto (la regla de
 * `[data-pantalla-fija]` en los estilos generales).
 *
 * En el celular, una columna como siempre: el mapa con su alto de siempre y
 * el panel debajo (o arriba, con `panelPrimero`).
 */
export function MapaConPanel({
  mapa,
  arribaDelMapa,
  debajoDelMapa,
  panel,
  panelPrimero = false,
  panelPrimeroEnComputadora = panelPrimero,
}: {
  /** El mapa, con `llenarElAltoEnLaComputadora`. */
  mapa: ReactNode;
  /** Lo que acompaña al mapa arriba, como un botón de marcar. */
  arribaDelMapa?: ReactNode;
  /** Lo que acompaña al mapa abajo, como la ayuda de qué tocar. */
  debajoDelMapa?: ReactNode;
  panel: ReactNode;
  /** `true` para el panel a la izquierda (y arriba en el celular). */
  panelPrimero?: boolean;
  /** Datos a la izquierda en PC, sin cambiar el orden del celular. */
  panelPrimeroEnComputadora?: boolean;
}) {
  const columnaDelMapa = (
    <div className={`space-y-2 lg:flex lg:min-h-0 lg:flex-col lg:gap-2 lg:space-y-0 ${panelPrimeroEnComputadora ? "lg:order-2" : ""}`}>
      {arribaDelMapa ? <div className="lg:shrink-0">{arribaDelMapa}</div> : null}
      <div className="lg:min-h-64 lg:flex-1">{mapa}</div>
      {debajoDelMapa ? <div className="space-y-2 lg:shrink-0">{debajoDelMapa}</div> : null}
    </div>
  );
  const columnaDelPanel = (
    <div className={`lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain ${panelPrimeroEnComputadora ? "lg:order-1" : ""}`}>{panel}</div>
  );

  return (
    <div
      data-pantalla-fija
      className={[
        "grid gap-3 lg:grid-rows-[minmax(0,1fr)]",
        panelPrimeroEnComputadora
          ? "lg:grid-cols-[minmax(20rem,26rem)_minmax(0,1fr)]"
          : "lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]",
      ].join(" ")}
    >
      {panelPrimero ? <>{columnaDelPanel}{columnaDelMapa}</> : <>{columnaDelMapa}{columnaDelPanel}</>}
    </div>
  );
}
