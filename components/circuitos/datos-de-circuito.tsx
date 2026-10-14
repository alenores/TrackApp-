import { Tarjeta } from "@/components/ui/tarjeta";
import { CifrasDeCircuito } from "@/components/circuitos/cifras-de-circuito";
import type { DatosDelCircuito } from "@/lib/circuitos/datos";
import type { ActividadRuta } from "@/types/database";

/**
 * Los datos de un Circuito: lo calculado (largo y desnivel) y lo cargado a
 * mano (técnica, esfuerzo, qué llevar, complicaciones y comentario).
 * Ver decisión 049. Las cifras van igual que en la tarjeta de la lista.
 * Solo muestra lo que recibe.
 */
export function DatosDeCircuito({ actividad, datos, largoM, desnivelPositivoM, desnivelNegativoM }: {
  actividad: ActividadRuta;
  datos: DatosDelCircuito | undefined;
  largoM: number | null;
  /** `null` si faltan alturas para calcularlo. */
  desnivelPositivoM: number | null;
  desnivelNegativoM: number | null;
}) {
  const textos: [string, string | null][] = [
    ["Qué llevar", datos?.queLlevar ?? null],
    ["Complicaciones", datos?.complicaciones ?? null],
    ["Comentario", datos?.comentario ?? null],
  ];

  return (
    <Tarjeta className="space-y-4">
      <h2 className="text-xl font-bold text-texto">Datos del Circuito</h2>
      <CifrasDeCircuito actividad={actividad} largoM={largoM}
        tecnica={datos?.tecnica ?? null} esfuerzo={datos?.nivelEsfuerzo ?? null}
        desnivelPositivoM={desnivelPositivoM} desnivelNegativoM={desnivelNegativoM} />
      {textos.map(([nombre, valor]) => (
        <div key={nombre} className="space-y-1">
          <h3 className="text-lg font-semibold text-texto">{nombre}</h3>
          <p className={`whitespace-pre-wrap text-base ${valor ? "text-texto" : "text-texto-suave"}`}>{valor ?? "Sin cargar."}</p>
        </div>
      ))}
    </Tarjeta>
  );
}
