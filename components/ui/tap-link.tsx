"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { vibrarAlTocar } from "@/lib/vibracion";
import { CLASE_DE_RESPUESTA_AL_TOQUE } from "@/lib/respuesta-al-toque";

type TapLinkProps = ComponentProps<typeof Link>;

export function TapLink({ className = "", onPointerDown, ...props }: TapLinkProps) {
  return (
    <Link
      {...props}
      className={[CLASE_DE_RESPUESTA_AL_TOQUE, className].filter(Boolean).join(" ")}
      onPointerDown={(event) => {
        vibrarAlTocar();
        onPointerDown?.(event);
      }}
    />
  );
}
