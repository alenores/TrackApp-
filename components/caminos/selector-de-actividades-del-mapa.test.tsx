// @vitest-environment jsdom
import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { expect, it } from "vitest";
import { ProveedorDeQuienSoy, type QuienSoy } from "@/components/armazon/quien-soy";
import { SelectorDeActividadesDelMapa } from "./selector-de-actividades-del-mapa";
import type { SeleccionDelMapa } from "@/lib/caminos/seleccion-del-mapa";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
it("separa actividades propias de las demás sin impedir seleccionar cualquiera ni Todas", async () => {
 const perfil:QuienSoy={miPerfilId:"yo",miCategoria:"normal",misActividades:["trekking","mountain_bike"],miActividadPrincipal:"trekking"};
 function Vista(){const [seleccion,elegir]=useState<SeleccionDelMapa>({visibles:["trekking"],principal:"trekking"});return <SelectorDeActividadesDelMapa seleccion={seleccion} alCambiar={elegir}/>;}
 const contenedor=document.createElement("div"),raiz=createRoot(contenedor);
 try {
  await act(async()=>raiz.render(<ProveedorDeQuienSoy quienSoy={perfil}><Vista/></ProveedorDeQuienSoy>));
  const propias=contenedor.querySelector('[aria-label="Tus actividades"]')!,otras=contenedor.querySelector('[aria-label="Otras actividades"]')!;
  expect([...propias.querySelectorAll('button')].map(b=>b.textContent)).toEqual(["Trekking","Mountain bike"]);
  expect([...otras.querySelectorAll('button')].map(b=>b.textContent)).toEqual(["Correr","Kayak","Canyoning"]);
  expect(propias.compareDocumentPosition(otras)&Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const kayak=[...otras.querySelectorAll('button')].find(b=>b.textContent==="Kayak")!;
  await act(async()=>kayak.click());expect(kayak.getAttribute('aria-checked')).toBe('true');
  await act(async()=>[...contenedor.querySelectorAll('button')].find(b=>b.textContent==="Todas")!.click());
  expect([...contenedor.querySelectorAll('[role="checkbox"]')].every(b=>b.getAttribute('aria-checked')==='true')).toBe(true);
  expect(perfil.misActividades).toEqual(["trekking","mountain_bike"]);
 } finally {await act(async()=>raiz.unmount());}
});
