import { execSync } from "node:child_process";
import type { NextConfig } from "next";
import withPWAInit from "next-pwa";
import cachePresets from "next-pwa/cache";

/**
 * Cómo la app funciona sin señal.
 *
 * Esto es lo que hace que TrackApp sirva en el cerro, y es lo primero que hay
 * que entender antes de tocar una línea de acá.
 *
 * **El motor offline guarda dos cosas por cada pantalla, no una.** Guarda el
 * documento —lo que llega cuando el usuario escribe la dirección o abre la app
 * desde cero— y guarda el pedido interno que hace la app al pasar de una
 * pantalla a otra por un link. Son respuestas distintas del servidor. Guardar
 * una sola de las dos deja la app abriendo bien y quedándose en blanco al tocar
 * cualquier cosa, o al revés.
 *
 * **Si una pantalla no está acá, sin señal no existe.** Lo que no tenga regla
 * propia cae en la última, que es la que menos sabe.
 *
 * Las reglas se prueban **en orden**: gana la primera que coincide. Por eso las
 * pantallas que nunca se guardan van antes que las que sí.
 *
 * ⚠️ **Las condiciones escritas como función se copian al motor como texto.**
 * Cualquier nombre de afuera —una constante, otra función— desaparece en el
 * viaje y la regla revienta al ejecutarse, tumbando **todo** el ruteo: la app
 * entera cae en la pantalla de «sin señal». Por eso cada condición se escribe
 * entera y sola, con sus expresiones adentro. Los objetos de `options` sí
 * viajan bien: son datos.
 */

function gitShortSha(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "sin-git";
  }
}

const OFFLINE_MEDIA_MAX_AGE_SECONDS = 120 * 24 * 60 * 60;
const BRAND_STATIC_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

/** Sin señal no se espera de gusto: se cae a lo guardado enseguida. */
const SEGUNDOS_DE_ESPERA = 3;

/**
 * Cuánto código guardado se aguanta.
 *
 * **El cupo se reparte entre versiones, no entre pantallas.** Los archivos de
 * una versión anterior siguen ocupando lugar, así que el cupo tiene que cubrir
 * varias versiones encadenadas. En Vías de Escalada, con 128, alcanzaba un día
 * de varias publicaciones para que el motor tirara justo los archivos del
 * inicio y la app abriera en blanco sin señal.
 */
const CUPO_DE_CODIGO = 384;
const CUPO_DE_ESTILOS = 48;

/**
 * Cómo se busca una pantalla guardada.
 *
 * Los pedidos internos de la app llevan un número distinto cada vez y la
 * respuesta viene marcada con condiciones que no coinciden al reabrir sin
 * señal. Sin estas dos, la pantalla está guardada y aun así no se encuentra.
 * Es un objeto de datos, así que viajar al motor no lo rompe.
 */
const COMO_BUSCAR_UNA_PANTALLA = {
  ignoreVary: true,
  ignoreSearch: true,
};

const presetsQueQuedan = (cachePresets as Array<{ options?: { cacheName?: string } }>).filter(
  (entry) => entry.options?.cacheName !== "others",
);

const withPWA = withPWAInit({
  dest: "public",
  register: false,
  skipWaiting: true,
  clientsClaim: true,
  disable: process.env.NODE_ENV === "development",
  /**
   * La regla del inicio que arma la librería sola **no** afloja las condiciones
   * de búsqueda, y el inicio responde con condiciones que al reabrir sin señal
   * no coinciden: la app caía en «sin señal» teniendo el inicio guardado. Se
   * apaga, y del inicio se encarga la regla de pantallas de entrada.
   */
  cacheStartUrl: false,
  dynamicStartUrl: false,
  /** Lo que se guarda se guarda al visitar, no al pasar el dedo por encima. */
  cacheOnFrontEndNav: false,
  /** Sin código ni estilos en el paquete inicial: se usa la última versión visitada. */
  buildExcludes: [/\.js$/, /\.css$/],
  fallbacks: {
    document: "/offline",
  },
  runtimeCaching: [
    {
      /** Cocina interna de la app que no es un archivo: nunca se guarda. */
      urlPattern: ({ url }: { url: URL }) =>
        url.pathname.startsWith("/_next/") && !url.pathname.startsWith("/_next/static/"),
      handler: "NetworkOnly",
      options: {},
    },
    {
      urlPattern: /\/_next\/static\/chunks\/.+\.js$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "codigo",
        expiration: {
          maxEntries: CUPO_DE_CODIGO,
          maxAgeSeconds: OFFLINE_MEDIA_MAX_AGE_SECONDS,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      urlPattern: /\/_next\/static\/css\/.+\.css$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "estilos",
        expiration: {
          maxEntries: CUPO_DE_ESTILOS,
          maxAgeSeconds: OFFLINE_MEDIA_MAX_AGE_SECONDS,
        },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      /** Entrar y salir de la cuenta trae un código de un solo uso: jamás guardado. */
      urlPattern: ({ url, sameOrigin }: { url: URL; sameOrigin: boolean }) =>
        sameOrigin && /^\/(?:login|auth)(?:\/|$)/.test(url.pathname),
      handler: "NetworkOnly",
      options: {},
    },
    {
      /**
       * Pantallas que escriben en la base —crear, editar, perfiles— y que por
       * lo tanto no sirven sin señal. Se marcan a mano para que no caigan en la
       * última regla y el celular muestre un formulario viejo creyendo que anda.
       */
      urlPattern: ({ url, sameOrigin }: { url: URL; sameOrigin: boolean }) =>
        sameOrigin &&
        (/\/(?:nueva|editar)\/?$/.test(url.pathname) ||
          /^\/perfil(?:es)?(?:\/|$)/.test(url.pathname)),
      handler: "NetworkOnly",
      options: {},
    },
    {
      /**
       * Pedido interno de las pantallas del cerro: la ruta y la navegación.
       *
       * **Primero lo guardado, sin preguntar.** Son las que se abren caminando,
       * con el celular en la mano y sin señal: mandan la velocidad y la certeza
       * de que abren. Para que llegue una versión nueva están las pantallas de
       * entrada, que sí preguntan a la red.
       */
      urlPattern: ({ request, url }: { request: Request; url: URL }) =>
        (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) &&
        /^\/(?:rutas|navegacion)\/\d+\/?$/.test(url.pathname),
      handler: "CacheFirst",
      options: {
        cacheName: "pantallas-del-cerro-interno",
        expiration: {
          maxEntries: 256,
          maxAgeSeconds: OFFLINE_MEDIA_MAX_AGE_SECONDS,
        },
        cacheableResponse: { statuses: [0, 200] },
        matchOptions: COMO_BUSCAR_UNA_PANTALLA,
      },
    },
    {
      /** El documento de esas mismas pantallas: otra respuesta, otro guardado. */
      urlPattern: ({ url, sameOrigin }: { url: URL; sameOrigin: boolean }) =>
        sameOrigin && /^\/(?:rutas|navegacion)\/\d+\/?$/.test(url.pathname),
      handler: "CacheFirst",
      options: {
        cacheName: "pantallas-del-cerro",
        expiration: {
          maxEntries: 256,
          maxAgeSeconds: OFFLINE_MEDIA_MAX_AGE_SECONDS,
        },
        cacheableResponse: { statuses: [0, 200] },
        matchOptions: COMO_BUSCAR_UNA_PANTALLA,
      },
    },
    {
      /**
       * Pedido interno de las pantallas de entrada: inicio, lista de rutas,
       * zonas y el detalle de una zona.
       *
       * **Primero la red, con poca paciencia.** Son la puerta por la que entra
       * una versión nueva al celular. Pasarlas a «primero lo guardado» congela
       * el teléfono en la versión vieja durante meses.
       */
      urlPattern: ({
        request,
        url,
        sameOrigin,
      }: {
        request: Request;
        url: URL;
        sameOrigin: boolean;
      }) =>
        sameOrigin &&
        (request.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) &&
        (url.pathname === "/" || /^\/(?:rutas|zonas)(?:\/\d+)?\/?$/.test(url.pathname)),
      handler: "NetworkFirst",
      options: {
        cacheName: "pantallas-de-entrada-interno",
        networkTimeoutSeconds: SEGUNDOS_DE_ESPERA,
        expiration: {
          maxEntries: 256,
          maxAgeSeconds: OFFLINE_MEDIA_MAX_AGE_SECONDS,
        },
        cacheableResponse: { statuses: [0, 200] },
        matchOptions: COMO_BUSCAR_UNA_PANTALLA,
      },
    },
    {
      /** El documento de las pantallas de entrada. */
      urlPattern: ({ url, sameOrigin }: { url: URL; sameOrigin: boolean }) =>
        sameOrigin &&
        (url.pathname === "/" || /^\/(?:rutas|zonas)(?:\/\d+)?\/?$/.test(url.pathname)),
      handler: "NetworkFirst",
      options: {
        cacheName: "pantallas-de-entrada",
        networkTimeoutSeconds: SEGUNDOS_DE_ESPERA,
        expiration: {
          maxEntries: 256,
          maxAgeSeconds: OFFLINE_MEDIA_MAX_AGE_SECONDS,
        },
        cacheableResponse: { statuses: [0, 200] },
        matchOptions: COMO_BUSCAR_UNA_PANTALLA,
      },
    },
    {
      /** La pantalla de «sin señal» tiene que estar guardada sí o sí. */
      urlPattern: ({ url, sameOrigin }: { url: URL; sameOrigin: boolean }) =>
        sameOrigin && /^\/offline\/?$/.test(url.pathname),
      handler: "CacheFirst",
      options: {
        cacheName: "pantalla-sin-senal",
        expiration: { maxEntries: 8, maxAgeSeconds: OFFLINE_MEDIA_MAX_AGE_SECONDS },
        cacheableResponse: { statuses: [0, 200] },
        matchOptions: COMO_BUSCAR_UNA_PANTALLA,
      },
    },
    {
      /** El logo y los íconos: livianos y casi fijos, se guardan mucho tiempo. */
      urlPattern: ({ url }: { url: URL }) => {
        const p = url.pathname;
        return (
          p === "/logo-identidad.png" ||
          p === "/icon-192x192.png" ||
          p === "/icon-512x512.png" ||
          p === "/icon-maskable-512x512.png" ||
          p === "/favicon.ico" ||
          p === "/icon.png" ||
          p === "/apple-icon.png"
        );
      },
      handler: "CacheFirst",
      options: {
        cacheName: "marca",
        expiration: { maxEntries: 16, maxAgeSeconds: BRAND_STATIC_MAX_AGE_SECONDS },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      /** Las fotos: una vez vistas quedan, para no volver a pagarlas en datos. */
      urlPattern: /^https:\/\/.*\.supabase\.co\/storage\//i,
      handler: "CacheFirst",
      options: {
        cacheName: "fotos",
        expiration: { maxEntries: 640, maxAgeSeconds: OFFLINE_MEDIA_MAX_AGE_SECONDS },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      /**
       * La base: **nunca guardada**.
       *
       * Las pantallas no leen de la base, leen del paquete que está en el
       * celular. Lo que va a la base es la puesta al día, y una respuesta vieja
       * ahí haría creer que ya se actualizó cuando no.
       */
      urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\//i,
      handler: "NetworkOnly",
      options: {},
    },
    {
      urlPattern: ({ request }: { request: Request }) => request.destination === "image",
      handler: "CacheFirst",
      options: {
        cacheName: "imagenes",
        expiration: { maxEntries: 640, maxAgeSeconds: OFFLINE_MEDIA_MAX_AGE_SECONDS },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      /**
       * Todo lo que no tiene regla propia.
       *
       * **Primero la red**, no primero lo guardado: una pantalla nueva que
       * alguien agregue y se olvide de anotar arriba va a andar sin señal igual,
       * pero no se va a quedar congelada en la versión vieja durante meses.
       */
      urlPattern: ({ url }: { url: URL }) => !url.pathname.startsWith("/api/"),
      handler: "NetworkFirst",
      options: {
        cacheName: "lo-demas",
        networkTimeoutSeconds: SEGUNDOS_DE_ESPERA,
        expiration: { maxEntries: 256, maxAgeSeconds: OFFLINE_MEDIA_MAX_AGE_SECONDS },
        cacheableResponse: { statuses: [0, 200] },
        matchOptions: { ignoreVary: true },
      },
    },
    ...presetsQueQuedan,
  ],
});

const nextConfig: NextConfig = {
  experimental: {
    /**
     * La versión nueva del framework junta los pedidos internos chicos en uno
     * solo. Eso cambia la forma de lo que llega y el motor offline guarda por
     * pantalla, así que se mantiene la forma de a uno hasta poder probar el
     * cambio en modo avión.
     */
    prefetchInlining: false,
  },
  env: {
    NEXT_PUBLIC_DEPLOY_SHA: gitShortSha(),
  },
  async headers() {
    const archivosDeMarca = [
      "/favicon.ico",
      "/logo-identidad.png",
      "/icon-192x192.png",
      "/icon-512x512.png",
      "/icon-maskable-512x512.png",
      "/manifest.webmanifest",
    ];
    return [
      {
        /** Entrar a la cuenta trae un código de un solo uso: nunca se guarda. */
        source: "/auth/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, max-age=0",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      ...archivosDeMarca.map((src) => ({
        source: src,
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      })),
    ];
  },
};

export default withPWA(nextConfig);
