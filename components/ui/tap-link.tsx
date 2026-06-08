"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { triggerTapHaptic } from "@/lib/haptics";
import { TAP_FEEDBACK_CLASS } from "@/lib/tap-feedback";

type TapLinkProps = ComponentProps<typeof Link>;

export function TapLink({ className = "", onPointerDown, ...props }: TapLinkProps) {
  return (
    <Link
      {...props}
      className={[TAP_FEEDBACK_CLASS, className].filter(Boolean).join(" ")}
      onPointerDown={(event) => {
        triggerTapHaptic();
        onPointerDown?.(event);
      }}
    />
  );
}
