import { execSync } from "node:child_process";
import type { NextConfig } from "next";
import withPWAInit from "next-pwa";
import cachePresets from "next-pwa/cache";

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

const defaultCachePresets = (cachePresets as Array<{ options?: { cacheName?: string } }>).filter(
  (entry) => entry.options?.cacheName !== "others",
);

const withPWA = withPWAInit({
  dest: "public",
  register: false,
  skipWaiting: true,
  clientsClaim: true,
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: false,
  buildExcludes: [/\.js$/, /\.css$/],
  fallbacks: {
    document: "/offline",
  },
  runtimeCaching: [
    {
      urlPattern: /\/_next\/static\/chunks\/.+\.js$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-js-assets",
        expiration: {
          maxEntries: 128,
          maxAgeSeconds: OFFLINE_MEDIA_MAX_AGE_SECONDS,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /\/_next\/static\/css\/.+\.css$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-style-assets",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: OFFLINE_MEDIA_MAX_AGE_SECONDS,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
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
        cacheName: "brand-static-png-cache-first",
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: BRAND_STATIC_MAX_AGE_SECONDS,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/storage\//i,
      handler: "CacheFirst",
      options: {
        cacheName: "supabase-storage-cache",
        expiration: {
          maxEntries: 640,
          maxAgeSeconds: OFFLINE_MEDIA_MAX_AGE_SECONDS,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\//i,
      handler: "NetworkOnly",
      options: {},
    },
    {
      urlPattern: ({ request }: { request: Request }) =>
        request.destination === "image",
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: {
          maxEntries: 640,
          maxAgeSeconds: OFFLINE_MEDIA_MAX_AGE_SECONDS,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      /** HTML autenticado: siempre red para no mostrar listados viejos en la PWA. */
      urlPattern: ({ request, url }: { request: Request; url: URL }) =>
        request.mode === "navigate" && !url.pathname.startsWith("/api/"),
      handler: "NetworkOnly",
      options: {},
    },
    {
      urlPattern: ({ url }: { url: URL }) => !url.pathname.startsWith("/api/"),
      handler: "CacheFirst",
      options: {
        cacheName: "others",
        expiration: {
          maxEntries: 256,
          maxAgeSeconds: OFFLINE_MEDIA_MAX_AGE_SECONDS,
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
        matchOptions: {
          ignoreVary: true,
        },
      },
    },
    ...defaultCachePresets,
  ],
});

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_DEPLOY_SHA: gitShortSha(),
  },
  async headers() {
    const brandAssets = [
      "/favicon.ico",
      "/logo-identidad.png",
      "/icon-192x192.png",
      "/icon-512x512.png",
      "/icon-maskable-512x512.png",
      "/manifest.webmanifest",
    ];
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      ...brandAssets.map((src) => ({
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
