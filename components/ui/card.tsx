import type { ReactNode } from "react";
import { TAP_FEEDBACK_CLASS } from "@/lib/tap-feedback";

type CardProps = {
  children: ReactNode;
  className?: string;
  accent?: boolean;
  tone?: "default" | "light";
  interactive?: boolean;
};

export function Card({
  children,
  className = "",
  accent = false,
  tone = "default",
  interactive = false,
}: CardProps) {
  return (
    <section
      className={[
        "rounded-2xl border px-4 py-4 shadow-sm",
        tone === "light"
          ? "border-slate-500/35 bg-slate-700/55"
          : "bg-surface",
        accent ? "border-x-4 border-x-emerald-600 border-y-border" : "border-border",
        interactive
          ? [
              TAP_FEEDBACK_CLASS,
              "cursor-pointer border-slate-600/70 shadow-md hover:border-emerald-700/45 hover:bg-slate-800/90 hover:shadow-lg",
            ].join(" ")
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}
