export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
          Modo offline
        </p>
        <h1 className="mt-2 text-2xl font-bold">Sin conexión a internet</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          La app no pudo conectarse en este momento. Si ya cargaste datos antes,
          podés seguir usando lo guardado offline.
        </p>
      </section>
    </main>
  );
}
