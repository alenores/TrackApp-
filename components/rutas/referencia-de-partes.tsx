import type { ActividadRuta } from "@/types/database";
import type { ComplejidadDeParte, DatosDeParte, PasoDeParte } from "@/lib/rutas/partes";
import { Boton } from "@/components/ui/boton";

export function nombreDelPaso(paso: PasoDeParte, actividades: ActividadRuta[] = []): string {
  if (paso === "por_explorar") return "Por explorar";
  if (paso === "sin_paso") return "Sin paso";
  const sola = actividades.length === 1 ? actividades[0] : null;
  if (paso === "transitable") {
    if (sola === "mountain_bike") return "En bici";
    if (sola === "kayak") return "En kayak";
    return "Transitable";
  }
  if (sola === "mountain_bike") return "A pie con la bici";
  if (sola === "kayak") return "A pie con el kayak";
  return "A pie con equipo";
}

export function nombreDeComplejidad(complejidad: ComplejidadDeParte): string {
  if (complejidad === "facil") return "Fácil";
  if (complejidad === "media") return "Media";
  if (complejidad === "dificil") return "Difícil";
  return "Sin clasificar";
}

const COLORES = [
  ["Fácil", "var(--parte-facil)"],
  ["Media", "var(--parte-media)"],
  ["Difícil", "var(--parte-dificil)"],
  ["Sin clasificar", "var(--parte-sin-clasificar)"],
] as const;

export function ReferenciaDePartes({ navegando = false }: { navegando?: boolean }) {
  return (
    <div className={`rounded-xl border border-borde-fuerte bg-superficie px-3 py-2 text-texto ${navegando ? "text-lg" : "text-sm"}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-semibold">Color:</span>
        {COLORES.map(([nombre, color]) => (
          <span key={nombre} className="inline-flex items-center gap-1">
            <span aria-hidden className="h-3 w-3 rounded-full border border-borde-fuerte" style={{ backgroundColor: color }} />
            {nombre}
          </span>
        ))}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-semibold">Línea:</span>
        <span>┄ Por explorar</span>
        <span>━ Transitable</span>
        <span>··· A pie con equipo</span>
        <span>× Sin paso</span>
      </div>
    </div>
  );
}

export function FichaDeParte({
  nombreRuta,
  datos,
  actividades = [],
  alCerrar,
}: {
  nombreRuta: string;
  datos: DatosDeParte;
  actividades?: ActividadRuta[];
  alCerrar: () => void;
}) {
  return (
    <div className="rounded-xl border border-borde-fuerte bg-superficie p-3 text-lg text-texto shadow-[var(--sombra-alta)]">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold">{nombreRuta}</p>
        <Boton variante="fantasma" onClick={alCerrar} aria-label="Cerrar el detalle de esta parte">×</Boton>
      </div>
      <p>{nombreDelPaso(datos.paso, actividades)} · {nombreDeComplejidad(datos.complejidad)}</p>
      {datos.observacion ? <p className="mt-1 whitespace-pre-wrap">{datos.observacion}</p> : null}
      {datos.comprobadoEl ? <p className="mt-1 text-texto-suave">Comprobado el {new Date(`${datos.comprobadoEl}T12:00:00`).toLocaleDateString("es-AR")}</p> : null}
    </div>
  );
}
