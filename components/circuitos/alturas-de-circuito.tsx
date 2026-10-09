"use client";

import { GraficoDeAlturas } from "@/components/ui/grafico-de-alturas";
import { Tarjeta } from "@/components/ui/tarjeta";
import { ReferenciaDePartes } from "@/components/rutas/referencia-de-partes";
import { textoDeAltura, textoDeDistancia } from "@/lib/alturas/grafico";
import type { AlturasDelCircuito } from "@/lib/circuitos/alturas";

/**
 * La tarjeta con el gráfico de alturas del Circuito, pintado con los colores
 * y marcas de los Caminos que usa (decisión 049). Si faltan alturas, lo dice
 * con el motivo: nunca queda en blanco.
 */
export function AlturasDeCircuito({ alturas, alSenalar }: {
  alturas: { ok: true; datos: AlturasDelCircuito } | { ok: false; error: string };
  alSenalar?: (distanciaM: number | null) => void;
}) {
  if (!alturas.ok) {
    return (
      <Tarjeta franja="ambar" className="space-y-2">
        <h2 className="text-xl font-bold text-texto">Alturas</h2>
        <p role="alert" className="text-base text-texto">{alturas.error}</p>
      </Tarjeta>
    );
  }
  const { datos } = alturas;
  return (
    <Tarjeta className="space-y-2">
      <h2 className="text-xl font-bold text-texto">Alturas</h2>
      <GraficoDeAlturas
        perfil={datos.perfil}
        tramos={datos.tramos}
        alSenalar={alSenalar}
        descripcion={`Alturas del Circuito: ${textoDeDistancia(datos.largoM)}, desnivel positivo ${textoDeAltura(datos.desnivelPositivoM)} y negativo ${textoDeAltura(datos.desnivelNegativoM)}.`}
      />
      <ReferenciaDePartes conPartesPropias />
      <p className="text-base text-texto-suave">Las alturas salen del relieve del terreno: son una estimación.</p>
    </Tarjeta>
  );
}
