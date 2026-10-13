"use client";

import { useMemo } from "react";
import { usePuedeAdministrar } from "@/hooks/use-puede-administrar";
import type { Paquete } from "@/lib/offline/paquete";
import { ListaDeZonas } from "@/components/zonas/lista-de-zonas";
import { PantallaDeMapas } from "@/components/mapas/pantalla-de-mapas";
import { BotonAgregar } from "@/components/ui/boton-agregar";
import { sectoresPorZona } from "@/lib/mapas/general";
import { useQuienSoy } from "@/components/armazon/quien-soy";

/** La entrada Zonas de Mapas: la lista de zonas con cuántos sectores tiene cada una. */
export function PantallaDeZonas() {
  const { miCategoria: categoria } = useQuienSoy();
  const puedeAdministrar = usePuedeAdministrar(categoria === "administrador");
  return (
    <PantallaDeMapas titulo="Zonas"
      accion={puedeAdministrar ? <BotonAgregar href="/zonas/dibujar" etiqueta="Nueva zona" /> : null}>
      {({ paquete }) => <Lista paquete={paquete} puedeAdministrar={puedeAdministrar} />}
    </PantallaDeMapas>
  );
}

function Lista({ paquete, puedeAdministrar }: { paquete: Paquete | null; puedeAdministrar: boolean }) {
  const zonas = useMemo(() => paquete?.zonas ?? [], [paquete]);
  const cantidades = useMemo(() => sectoresPorZona(paquete?.sectores ?? []), [paquete]);
  return <ListaDeZonas zonas={zonas} soyAdministrador={puedeAdministrar} sectoresPorZona={cantidades} />;
}
