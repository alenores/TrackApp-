"use client";

import { useEffect } from "react";
import { trabarElZoom } from "@/lib/sin-zoom";

/** Bloquea zoom del viewport (app y navegador). */
export function PreventViewportZoom() {
  useEffect(() => trabarElZoom(), []);
  return null;
}
