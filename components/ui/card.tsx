import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  accent?: boolean;
};

export function Card({ children, className = "", accent = false }: CardProps) {
  return (
    <section
      className={[
        "rounded-2xl border bg-surface px-4 py-4 shadow-sm",
        accent ? "border-x-4 border-x-emerald-600 border-y-border" : "border-border",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}
