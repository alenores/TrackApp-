import Link from "next/link";

export function NuevaRutaFab() {
  return (
    <Link
      href="/rutas/nueva"
      aria-label="Nueva ruta"
      className="fixed z-30 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-700/60 bg-accent-light text-2xl font-light leading-none text-accent-foreground shadow-lg shadow-black/40 transition-transform hover:scale-105 active:scale-95 bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] right-4"
    >
      +
    </Link>
  );
}
