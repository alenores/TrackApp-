/**
 * Cuántos caracteres van de los que entran, abajo a la derecha del campo:
 * chico y discreto, para que no compita con lo que se escribe (Ale, 2026-10-14).
 */
export function ContadorDeCaracteres({ texto, maximo }: { texto: string; maximo: number }) {
  return (
    <span className="mt-1 block text-right text-xs text-texto-suave">
      {Array.from(texto).length}/{maximo.toLocaleString("es-AR")}
    </span>
  );
}
