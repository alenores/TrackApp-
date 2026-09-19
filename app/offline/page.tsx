export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-fondo px-4 py-10 text-texto">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-borde bg-fondo p-6 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-wider text-acento-tenue">
          Modo offline
        </p>
        <h1 className="mt-2 text-2xl font-bold">Sin conexión a internet</h1>
        <p className="mt-3 text-sm leading-6 text-texto-suave">
          La app no pudo conectarse en este momento. Si ya cargaste datos antes,
          podés seguir usando lo guardado offline.
        </p>
      </section>
    </main>
  );
}
