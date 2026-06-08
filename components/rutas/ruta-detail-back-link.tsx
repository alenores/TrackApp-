"use client";

import { ChevronCircle } from "@/components/ui/chevron-circle";
import { TapLink } from "@/components/ui/tap-link";

export function RutaDetailBackLink() {
  return (
    <TapLink
      href="/"
      aria-label="Volver al listado de rutas"
      className="mt-0.5 shrink-0"
    >
      <ChevronCircle direction="left" />
    </TapLink>
  );
}
