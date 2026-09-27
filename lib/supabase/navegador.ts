import { createBrowserClient } from "@supabase/ssr";
import { avisarFallaDeRed } from "@/lib/conexion";

/**
 * Tope de espera de un pedido a la base (2026-09-27).
 *
 * Sin tope, con la señal del cerro —hay red pero no pasa nada— un pedido podía
 * quedar esperando minutos: la puesta al día, la subida de anotaciones, todo
 * colgado. Con el tope, el pedido falla con su motivo y se le avisa a
 * `lib/conexion.ts`, que confirma si la señal no alcanza y pasa la app al modo
 * sin señal.
 */
const TOPE_PEDIDO_MS = 15_000;

/**
 * Las subidas de fotos quedan afuera: con señal floja una foto de 2 MB puede
 * tardar más que el tope y cortarla sería peor. Su falla ya se muestra con el
 * motivo real.
 */
function esSubidaDeArchivo(url: string, init?: RequestInit): boolean {
  const metodo = (init?.method ?? "GET").toUpperCase();
  return metodo !== "GET" && metodo !== "HEAD" && url.includes("/storage/v1/object");
}

function direccionDe(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

async function pedirConTope(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (esSubidaDeArchivo(direccionDe(input), init)) return fetch(input, init);

  const control = new AbortController();
  const original = init?.signal;
  // Si quien pidió cancela, se cancela igual que antes.
  if (original) {
    if (original.aborted) control.abort(original.reason);
    else original.addEventListener("abort", () => control.abort(original.reason), { once: true });
  }
  let vencio = false;
  const corte = setTimeout(() => {
    vencio = true;
    control.abort();
  }, TOPE_PEDIDO_MS);

  try {
    return await fetch(input, { ...init, signal: control.signal });
  } catch (error) {
    // Cancelado a propósito por quien pidió: no es un problema de señal.
    if (!vencio && original?.aborted) throw error;
    avisarFallaDeRed();
    if (vencio) {
      throw new TypeError(
        "La conexión no respondió a tiempo. Probá de nuevo cuando tengas mejor señal.",
      );
    }
    throw error;
  } finally {
    clearTimeout(corte);
  }
}

export function crearClienteEnElNavegador() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local",
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    global: { fetch: pedirConTope },
  });
}
