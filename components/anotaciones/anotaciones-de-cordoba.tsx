"use client";

import { EditorDeAnotaciones } from "@/components/anotaciones/editor-de-anotaciones";

/**
 * La pestaña Anotaciones de Mapas: la pantalla de anotaciones compartida, la
 * misma del sector, mirando toda Córdoba. Lo que se marca acá no queda atado
 * a un sector: manda dónde está (decisión 027).
 *
 * Solo el administrador; la base lo exige por su cuenta.
 */
export function AnotacionesDeCordoba({ soyAdministrador }: { soyAdministrador: boolean }) {
  return <EditorDeAnotaciones lugar={{ clase: "cordoba" }} puedeAnotar={soyAdministrador} />;
}
