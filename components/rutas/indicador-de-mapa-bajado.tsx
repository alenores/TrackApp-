/**
 * Cuánto del mapa de un Circuito está en este celular, en la tarjeta.
 *
 * Es lo que se mira en casa antes de salir, sin abrir ningún aviso: verde si
 * está todo, ámbar si falta algo, con una barrita que dice cuánto. Se cuenta
 * en sectores, que es lo que se baja.
 */
export function IndicadorDeMapaBajado({ bajados, total }: { bajados: number; total: number }) {
  if (total === 0) {
    return <p className="text-sm font-medium text-ambar-texto">No cruza ningún sector: no hay mapa para bajar.</p>;
  }
  const completo = bajados >= total;
  const porcentaje = Math.round((bajados / total) * 100);
  return (
    <div className="space-y-1" aria-label={completo ? "Mapa bajado completo" : `Mapa bajado: ${bajados} de ${total} sectores`}>
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <svg viewBox="0 0 24 24" fill="none" className={`h-4 w-4 ${completo ? "text-verde-icono" : "text-ambar-icono"}`} aria-hidden
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {completo ? <path d="m5 12 5 5 9-10" /> : <><path d="M12 4v11m0 0-4-4m4 4 4-4" /><path d="M5 19h14" /></>}
        </svg>
        <span className={completo ? "text-verde-texto" : "text-ambar-texto"}>
          {completo ? "Mapa bajado" : bajados === 0 ? "Sin mapa bajado" : `Mapa: ${bajados} de ${total} sectores`}
        </span>
      </div>
      {completo ? null : (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-superficie-alta" aria-hidden>
          <div className="h-full rounded-full bg-ambar-icono" style={{ width: `${porcentaje}%` }} />
        </div>
      )}
    </div>
  );
}
