import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-slate-300"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={[
          "w-full min-h-12 rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground",
          "placeholder:text-muted focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/30",
          error ? "border-red-500/70 focus:border-red-500 focus:ring-red-500/30" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
      {error ? (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
