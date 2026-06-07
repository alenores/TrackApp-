"use client";

import { useEffect } from "react";
import { mountViewportZoomPrevention } from "@/lib/prevent-viewport-zoom";

/** Bloquea zoom del viewport (app y navegador). */
export function PreventViewportZoom() {
  useEffect(() => mountViewportZoomPrevention(), []);
  return null;
}
