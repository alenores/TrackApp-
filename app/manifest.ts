import type { MetadataRoute } from "next";
import { PUBLIC_STATIC_IMAGE_QUERY } from "@/lib/public-static-image-query";

export default function manifest(): MetadataRoute.Manifest {
  const q = PUBLIC_STATIC_IMAGE_QUERY;

  return {
    name: "TrackApp",
    short_name: "TrackApp",
    description: "Rutas GPX, mapas y navegación offline.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f172a",
    theme_color: "#1b4332",
    lang: "es-AR",
    icons: [
      {
        src: `/icon-maskable-512x512.png${q}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: `/icon-192x192.png${q}`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `/icon-512x512.png${q}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
