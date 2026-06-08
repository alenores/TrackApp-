"use client";

import { TapLink } from "@/components/ui/tap-link";

export function RutaDetailBackLink() {
  return (
    <TapLink
      href="/"
      className="shrink-0 rounded-lg px-2 py-1 text-sm text-emerald-300 hover:text-emerald-200"
    >
      ← Volver
    </TapLink>
  );
}
