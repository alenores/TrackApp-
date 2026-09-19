import { AppReadyMarker } from "@/components/layout/app-ready-marker";
import { ZonaList } from "@/components/zonas/zona-list";
import { soyAdministrador } from "@/lib/perfiles/datos";
import { traerSectores } from "@/lib/sectores/datos";
import { traerZonas } from "@/lib/zonas/datos";

export default async function ZonasPage() {
  const [zonas, sectores, esAdministrador] = await Promise.all([
    traerZonas(),
    traerSectores(),
    soyAdministrador(),
  ]);

  const sectoresPorZona: Record<number, number> = {};
  for (const sector of sectores.filas) {
    sectoresPorZona[sector.zonaId] = (sectoresPorZona[sector.zonaId] ?? 0) + 1;
  }

  return (
    <>
      <AppReadyMarker />
      <ZonaList
        zonas={zonas.filas}
        soyAdministrador={esAdministrador}
        sectoresPorZona={sectoresPorZona}
        avisoDeListaIncompleta={zonas.completa ? null : zonas.motivo}
      />
    </>
  );
}
