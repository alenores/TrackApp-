import { CLASE_DEL_CIRCULO } from "@/components/ui/flecha-redonda";

type CloseCircleProps = {
  className?: string;
};

export function CruzRedonda({ className = "" }: CloseCircleProps) {
  return (
    <span
      className={[CLASE_DEL_CIRCULO, className].filter(Boolean).join(" ")}
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
