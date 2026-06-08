type ChevronCircleProps = {
  direction?: "left" | "right";
  className?: string;
};

export function ChevronCircle({
  direction = "right",
  className = "",
}: ChevronCircleProps) {
  const path = direction === "left" ? "m15 18-6-6 6-6" : "m9 6 6 6-6 6";

  return (
    <span
      className={[
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-600/70 bg-slate-800/80 text-slate-400",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
        <path
          d={path}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
