import type { ButtonHTMLAttributes, PointerEvent } from "react";
import { triggerTapHaptic } from "@/lib/haptics";
import { TAP_FEEDBACK_CLASS } from "@/lib/tap-feedback";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent-light text-accent-foreground hover:bg-accent border border-emerald-700/50",
  secondary:
    "bg-surface-elevated text-foreground hover:bg-slate-600 border border-border",
  ghost: "bg-transparent text-muted hover:bg-surface-elevated hover:text-foreground",
  danger:
    "bg-red-950/60 text-red-300 hover:bg-red-900/60 border border-red-800/50",
};

export function Button({
  variant = "primary",
  fullWidth = false,
  className = "",
  type = "button",
  disabled,
  children,
  onPointerDown,
  ...props
}: ButtonProps) {
  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (!disabled) {
      triggerTapHaptic();
    }
    onPointerDown?.(event);
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onPointerDown={handlePointerDown}
      className={[
        TAP_FEEDBACK_CLASS,
        "inline-flex min-h-12 items-center justify-center rounded-xl px-5 py-3 text-base font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60",
        "disabled:cursor-not-allowed disabled:opacity-50",
        fullWidth ? "w-full" : "",
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
