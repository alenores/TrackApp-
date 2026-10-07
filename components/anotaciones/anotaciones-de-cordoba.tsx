"use client";

import { EditorDeAnotaciones } from "@/components/anotaciones/editor-de-anotaciones";

/**
 * La pestaña Anotaciones de Mapas: la pantalla de anotaciones compartida, la
 * misma del sector, mirando toda Córdoba. Lo que se marca acá no queda atado
 * a un sector: manda dónde está (decisión 027).
 *
 * Todos la consultan; Administrador y Premium pueden aportar al mapa.
 */
export function AnotacionesDeCordoba({ puedeAnotar, miPerfilId, esAdministrador }: { puedeAnotar: boolean; miPerfilId: string | null; esAdministrador: boolean }) {
  return <EditorDeAnotaciones lugar={{ clase: "cordoba" }} puedeAnotar={puedeAnotar} miPerfilId={miPerfilId} esAdministrador={esAdministrador} />;
}
