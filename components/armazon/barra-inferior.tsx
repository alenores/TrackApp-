"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DESTINOS_DEL_MENU, destinoActivo, subdestinoActivo, type SubdestinoDelMenu } from "@/components/armazon/destinos-del-menu";
import { Emergente } from "@/components/ui/emergente";
import { useHaySenal } from "@/hooks/use-hay-senal";

const CLASE_DEL_DESTINO = "flex min-h-[56px] min-w-[56px] flex-1 flex-col items-center justify-center py-1 text-[11px] font-medium transition-colors";

function ContenidoDelDestino({ etiqueta, icono, activo }: { etiqueta: string; icono: ReactNode; activo: boolean }) {
  return <>
    <span className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${activo ? "bg-verde-fondo text-verde-texto" : ""}`}>
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icono}</svg>
    </span>
    <span className="mt-0.5 max-w-full text-center leading-tight tracking-tight">
      {etiqueta === "Navegación libre" ? <>Navegación<br />libre</> : etiqueta}
    </span>
  </>;
}

export function BarraInferior() {
  const haySenal = useHaySenal();
  const pathname = usePathname();
  const [eligiendoEn, setEligiendoEn] = useState<{ etiqueta: string; subdestinos: SubdestinoDelMenu[] } | null>(null);
  const cerrar = () => setEligiendoEn(null);

  return (
    <>
      <nav aria-label="Navegación inferior mobile"
        className="fixed bottom-0 left-0 right-0 z-40 flex min-h-[56px] items-center justify-around border-t border-borde bg-superficie/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        {DESTINOS_DEL_MENU.filter((item) => haySenal || !item.necesitaSenal).map((item) => {
          const activo = destinoActivo(item.href, pathname);
          const clase = `${CLASE_DEL_DESTINO} ${activo ? "font-semibold text-acento-borde" : "text-texto-suave hover:text-texto"}`;
          // Con varias pantallas adentro, tocarlo sube el panel para elegir:
          // así cada pantalla queda limpia, sin botones de pestañas arriba.
          if (item.subdestinos) {
            const subdestinos = item.subdestinos;
            return <button key={item.href} type="button" className={clase} aria-haspopup="dialog"
              onClick={() => setEligiendoEn({ etiqueta: item.etiqueta, subdestinos })}>
              <ContenidoDelDestino etiqueta={item.etiqueta} icono={item.icono} activo={activo} />
            </button>;
          }
          return <Link key={item.href} href={item.href} className={clase}>
            <ContenidoDelDestino etiqueta={item.etiqueta} icono={item.icono} activo={activo} />
          </Link>;
        })}
      </nav>

      <Emergente hoja abierto={eligiendoEn !== null} alCerrar={cerrar} titulo={eligiendoEn?.etiqueta ?? ""}>
        {eligiendoEn ? (
          <ul className="space-y-2">
            {eligiendoEn.subdestinos.map((sub) => {
              const aca = subdestinoActivo(eligiendoEn.subdestinos, pathname)?.href === sub.href;
              return <li key={sub.href}>
                <Link href={sub.href} replace onClick={cerrar} aria-current={aca ? "page" : undefined}
                  className={`flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2 shadow-[var(--sombra)] ${aca ? "border-acento-borde bg-verde-fondo" : "border-borde bg-superficie hover:border-acento-borde"}`}>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${aca ? "bg-superficie text-verde-icono" : "bg-verde-fondo text-verde-icono"}`}>
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{sub.icono}</svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-base font-semibold text-texto">
                      {sub.etiqueta}
                      {aca ? <span className="rounded-full bg-superficie px-2 text-xs font-medium text-verde-texto">Acá estás</span> : null}
                    </span>
                    <span className="block text-sm leading-5 text-texto-suave">{sub.queHay}</span>
                  </span>
                </Link>
              </li>;
            })}
          </ul>
        ) : null}
      </Emergente>
    </>
  );
}
