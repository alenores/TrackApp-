import { Tarjeta } from "@/components/ui/tarjeta";
import { CLASE_DE_COLOR_DE_ESFUERZO, DibujoDeVelocimetro, IndicadorTecnica } from "@/components/rutas/indicadores-de-exigencia";
import { mostrarEsfuerzo } from "@/lib/rutas/actividades";
import { textoDeAltura, textoDeDistancia } from "@/lib/alturas/grafico";
import type { DatosDelCircuito } from "@/lib/circuitos/datos";

/**
 * Los datos de un Circuito: lo calculado (largo y desnivel) y lo cargado a
 * mano (técnica, esfuerzo, qué llevar, complicaciones y comentario).
 * Ver decisión 049. Solo muestra lo que recibe.
 */
export function DatosDeCircuito({ datos, largoM, desnivelPositivoM, desnivelNegativoM }: {
  datos: DatosDelCircuito | undefined;
  largoM: number | null;
  /** `null` si faltan alturas para calcularlo. */
  desnivelPositivoM: number | null;
  desnivelNegativoM: number | null;
}) {
  const cifras: [string, string][] = [
    ["Largo", largoM === null ? "—" : textoDeDistancia(largoM)],
    ["Desnivel positivo", desnivelPositivoM === null ? "—" : textoDeAltura(desnivelPositivoM)],
    ["Desnivel negativo", desnivelNegativoM === null ? "—" : textoDeAltura(desnivelNegativoM)],
  ];
  const textos: [string, string | null][] = [
    ["Qué llevar", datos?.queLlevar ?? null],
    ["Complicaciones", datos?.complicaciones ?? null],
    ["Comentario", datos?.comentario ?? null],
  ];

  return (
    <Tarjeta className="space-y-4">
      <h2 className="text-xl font-bold text-texto">Datos del Circuito</h2>
      <dl className="grid grid-cols-3 gap-2">
        {cifras.map(([nombre, valor]) => (
          <div key={nombre} className="rounded-lg bg-superficie-alta px-3 py-2">
            <dd className="text-xl font-bold text-texto">{valor}</dd>
            <dt className="text-base text-texto-suave">{nombre}</dt>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap items-start gap-6">
        <div className="space-y-1">
          <p className="text-base text-texto-suave">Técnica</p>
          <div className="flex items-center gap-2">
            {datos?.tecnica ? <>
              <IndicadorTecnica tecnica={datos.tecnica} />
              <span className="text-base font-semibold text-texto">{datos.tecnica} de 10</span>
            </> : <p className="text-base text-texto-suave">Sin cargar.</p>}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-base text-texto-suave">Esfuerzo</p>
          {datos?.nivelEsfuerzo ? (
            <div className="flex items-center gap-2">
              <span className={CLASE_DE_COLOR_DE_ESFUERZO[datos.nivelEsfuerzo]}><DibujoDeVelocimetro esfuerzo={datos.nivelEsfuerzo} className="h-5 w-10" /></span>
              <span className="text-base font-semibold text-texto">{mostrarEsfuerzo(datos.nivelEsfuerzo)}</span>
            </div>
          ) : <p className="text-base text-texto-suave">Sin cargar.</p>}
        </div>
      </div>
      {textos.map(([nombre, valor]) => (
        <div key={nombre} className="space-y-1">
          <h3 className="text-lg font-semibold text-texto">{nombre}</h3>
          <p className={`whitespace-pre-wrap text-base ${valor ? "text-texto" : "text-texto-suave"}`}>{valor ?? "Sin cargar."}</p>
        </div>
      ))}
    </Tarjeta>
  );
}
