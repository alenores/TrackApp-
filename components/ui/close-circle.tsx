import { CIRCLE_ICON_SURFACE_CLASS } from "@/components/ui/chevron-circle";

type CloseCircleProps = {
  className?: string;
};

export function CloseCircle({ className = "" }: CloseCircleProps) {
  return (
    <span
      className={[CIRCLE_ICON_SURFACE_CLASS, className].filter(Boolean).join(" ")}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
        <path
          d="m8 8 8 8M16 8l-8 8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
