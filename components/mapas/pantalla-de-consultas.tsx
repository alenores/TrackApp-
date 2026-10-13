"use client";

import { useMemo, useState } from "react";
import { PantallaDeMapas } from "@/components/mapas/pantalla-de-mapas";
import { MapaDeMarcas } from "@/components/marcas/mapa-de-marcas";
import { SelectorDeActividadPrincipal } from "@/components/caminos/selector-de-actividad-principal";
import { ListaYMapa } from "@/components/ui/lista-y-mapa";
import { ReferenciaDePartes } from "@/components/rutas/referencia-de-partes";
import { RenglonDeCapa } from "@/components/ui/renglon-de-capa";
import { CLASE_DE_TITULO_DE_SECCION } from "@/components/ui/opciones";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useActividadPrincipal } from "@/hooks/use-actividad-principal";
import { useCaminosGuardados } from "@/hooks/use-caminos-guardados";
import { usePreferencia } from "@/hooks/use-preferencia";
import { sectoresPorZona } from "@/lib/mapas/general";
import { CAPAS_DE_CONSULTAS, leerCapasDeConsultas, resumenDeCapas, TODAS_LAS_CAPAS, type CapaDeConsultas } from "@/lib/marcas/consultas";
import type { Paquete } from "@/lib/offline/paquete";

/**
 * **Consultas**, la entrada de Mapas para todo público: el mapa con todo lo
 * marcado y las zonas, para mirar.
 *
 * Los filtros son pocos a propósito: la actividad (que decide qué
 * clasificación de los Caminos se destaca) y prender o apagar Caminos, Zonas y
 * Detalles. Detalles junta puntos, trazos, tranqueras y alambrados. Lo elegido
 * se recuerda en el celular.
 *
 * El detalle fino —tildar marca por marca— está en Marcas, que es para quien
 * carga y necesita ver con lupa.
 */
export function PantallaDeConsultas() {
  return (
    <PantallaDeMapas titulo="Consultas" ancha avisaIncompletoSola>
      {({ paquete, estado, aviso }) => <Consultas paquete={paquete} incompleto={estado === "incompleto" ? aviso : null} />}
    </PantallaDeMapas>
  );
}

function Consultas({ paquete, incompleto }: { paquete: Paquete | null; incompleto: string | null }) {
  const [actividad, elegirActividad] = useActividadPrincipal();
  const [capas, guardarCapas] = usePreferencia<CapaDeConsultas[]>("capas-de-consultas", TODAS_LAS_CAPAS, leerCapasDeConsultas);
  const [panelArriba, setPanelArriba] = useState(false);

  const zonas = useMemo(() => paquete?.zonas ?? [], [paquete]);
  const anotaciones = useMemo(() => paquete?.anotaciones ?? [], [paquete]);
  const caminosSinLinea = useMemo(() => paquete?.caminos ?? [], [paquete]);
  const cantidades = useMemo(() => sectoresPorZona(paquete?.sectores ?? []), [paquete]);
  const { caminos, error: errorDeCaminos, cargando: cargandoCaminos } = useCaminosGuardados(caminosSinLinea);

  const ver = (capa: CapaDeConsultas) => capas.includes(capa);
  const alternar = (capa: CapaDeConsultas) =>
    guardarCapas(ver(capa) ? capas.filter((cada) => cada !== capa) : [...capas, capa]);

  return (
    <div className="space-y-3">
      <ListaYMapa
        avisos={cargandoCaminos && caminosSinLinea.length > 0 || errorDeCaminos || incompleto ? <>
          {cargandoCaminos && caminosSinLinea.length > 0 ? <p role="status" className="text-base text-texto">Abriendo los Caminos…</p> : null}
          {errorDeCaminos ? <Tarjeta franja="ambar"><p role="alert" className="text-base text-texto">{errorDeCaminos}</p></Tarjeta> : null}
          {incompleto ? <Tarjeta franja="ambar"><p role="alert" className="text-base text-texto">Lo que ves puede estar incompleto: {incompleto}. Recargá para intentar de nuevo.</p></Tarjeta> : null}
        </> : null}
        tituloDelPanel="Qué mirar"
        pantallaCompletaEnCelular="Consultas"
        panelCorto
        resumen={resumenDeCapas(capas)}
        abierto={panelArriba}
        alCambiarAbierto={setPanelArriba}
        panel={
          <div className="space-y-2">
            <p className={CLASE_DE_TITULO_DE_SECCION}>Mostrar</p>
            {CAPAS_DE_CONSULTAS.map((capa) => (
              <RenglonDeCapa key={capa.valor} titulo={capa.etiqueta} queMuestra={capa.queMuestra}
                prendida={ver(capa.valor)} alAlternar={() => alternar(capa.valor)}>
                {/* La actividad y la referencia solo explican los Caminos: van adentro de su renglón. */}
                {capa.valor === "caminos" && ver("caminos") ? (
                  <div className="space-y-3">
                    <SelectorDeActividadPrincipal forma="insignias" actividad={actividad} alCambiar={elegirActividad} />
                    <ReferenciaDePartes />
                  </div>
                ) : capa.valor === "zonas" && ver("zonas") && zonas.length === 0 ? (
                  <p className="text-sm text-texto-suave">Todavía no hay zonas dibujadas en Córdoba.</p>
                ) : null}
              </RenglonDeCapa>
            ))}
          </div>
        }
        mapa={
          <MapaDeMarcas
            llenarElLugar
            zonas={ver("zonas") ? zonas : []}
            anotaciones={ver("detalles") ? anotaciones : []}
            caminos={ver("caminos") ? caminos : []}
            actividad={actividad}
            sectoresPorZona={cantidades}
            avisoSinNada={capas.length === 0 ? "No elegiste nada para mirar. Abrí los filtros y prendé Caminos, Zonas o Detalles." : null}
          />
        }
      />
    </div>
  );
}
