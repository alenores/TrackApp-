import { MarcaDeAppLista } from "@/components/armazon/marca-de-app-lista";

/**
 * La pantalla de rescate: aparece cuando se pide una pantalla que no está
 * guardada en el celular y no hay señal para ir a buscarla.
 *
 * **Es la última red.** Si esta no se ve, el usuario se queda mirando negro.
 * Por eso avisa que está lista apenas se dibuja: sin ese aviso, la tapa del
 * arranque se queda encima y este texto no se lee nunca.
 */
export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-fondo px-4 py-10 text-texto">
      <MarcaDeAppLista />

      <section className="mx-auto w-full max-w-md space-y-4 rounded-2xl border border-borde bg-superficie p-6 shadow-lg">
        <h1 className="text-2xl font-bold">Esta pantalla no está en el celular</h1>

        <p className="text-base leading-7 text-texto-suave">
          No hay señal para ir a buscarla, y guardada no está: solo quedan las
          pantallas que abriste alguna vez con conexión.
        </p>

        <p className="text-base leading-7 text-texto-suave">
          Volvé al inicio, que sí funciona sin señal. Desde ahí llegás a tus
          rutas y a los mapas que bajaste.
        </p>

        {/*
          Un link pelado a propósito, y es el único de la app. Acá la pantalla
          que está dibujada no es la de la dirección que se pidió, así que la
          navegación interna no tiene de dónde agarrarse. Un pedido nuevo del
          inicio, en cambio, lo contesta lo guardado en el celular.
        */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          className="flex min-h-10 w-full items-center justify-center rounded-xl border border-acento-borde bg-acento px-4 text-sm font-semibold text-acento-texto"
        >
          Ir al inicio
        </a>
      </section>
    </main>
  );
}
