import type { ReactNode } from "react";
import { InsigniaDeActividad } from "@/components/rutas/insignias-de-actividad";
import { CLASE_DE_COLOR_DE_ESFUERZO, DibujoDeVelocimetro, IndicadorTecnica } from "@/components/rutas/indicadores-de-exigencia";
import { ICONO_DE_BAJA, ICONO_DE_SUBE } from "@/components/ui/iconos";
import { mostrarEsfuerzo } from "@/lib/rutas/actividades";
import { textoDeAltura, textoDeDistancia } from "@/lib/alturas/grafico";
import type { ActividadRuta, NivelEsfuerzo } from "@/types/database";

/**
 * Las cifras de un Circuito, iguales en la tarjeta de la lista y en el
 * detalle: la actividad, el largo grande al medio —el dato más importante— y
 * abajo cuatro columnas del mismo peso: técnica, esfuerzo, cuánto sube y
 * cuánto baja. Lo que falta va con una raya, así las cuatro quedan siempre en
 * su lugar (Ale, 2026-10-13).
 */
export function CifrasDeCircuito({ actividad, largoM, tecnica, esfuerzo, desnivelPositivoM, desnivelNegativoM }: {
  actividad: ActividadRuta;
  largoM: number | null;
  tecnica: number | null;
  esfuerzo: NivelEsfuerzo | null;
  /** `null` si faltan alturas para calcularlo. */
  desnivelPositivoM: number | null;
  desnivelNegativoM: number | null;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-center">
        <InsigniaDeActividad tipo={actividad} tamano="mediano" />
      </div>
      <p className="text-center text-4xl font-bold text-texto">{largoM === null ? "—" : textoDeDistancia(largoM)}</p>
      <dl className="grid grid-cols-4 gap-1 border-t border-borde pt-3 text-center">
        <Cifra nombre="Técnica">
          {tecnica === null ? <Raya /> : <>
            <IndicadorTecnica tecnica={tecnica} />
            <span className="text-sm font-semibold text-texto">{tecnica} de 10</span>
          </>}
        </Cifra>
        <Cifra nombre="Esfuerzo">
          {esfuerzo === null ? <Raya /> : <span className={`flex flex-col items-center ${CLASE_DE_COLOR_DE_ESFUERZO[esfuerzo]}`}>
            <DibujoDeVelocimetro esfuerzo={esfuerzo} className="h-5 w-10" />
            <span className="text-sm font-semibold">{mostrarEsfuerzo(esfuerzo)}</span>
          </span>}
        </Cifra>
        <Cifra nombre="Sube" icono={ICONO_DE_SUBE}>
          {desnivelPositivoM === null ? <Raya /> : <span className="text-base font-bold text-texto">{textoDeAltura(desnivelPositivoM)}</span>}
        </Cifra>
        <Cifra nombre="Baja" icono={ICONO_DE_BAJA}>
          {desnivelNegativoM === null ? <Raya /> : <span className="text-base font-bold text-texto">{textoDeAltura(desnivelNegativoM)}</span>}
        </Cifra>
      </dl>
    </div>
  );
}

function Cifra({ nombre, icono, children }: { nombre: string; icono?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      <dt className="flex items-center gap-0.5 text-sm font-semibold text-texto-suave">
        {nombre}
        {icono ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"
          strokeLinejoin="round" className="h-4 w-4" aria-hidden>{icono}</svg> : null}
      </dt>
      <dd className="flex min-h-10 flex-col items-center justify-center gap-0.5">{children}</dd>
    </div>
  );
}

function Raya() {
  return <span className="text-base font-bold text-texto-suave">—</span>;
}
