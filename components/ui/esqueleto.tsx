type SkeletonProps = {
  className?: string;
};

/** El bloque gris que se ve mientras algo carga. */
export function Esqueleto({ className = "" }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={["animate-pulse rounded-xl bg-superficie-alta", className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
