import type { InputHTMLAttributes } from "react";

/**
 * Un campo de texto.
 *
 * El contorno usa el borde fuerte, no la rayita de separar: el usuario tiene
 * que ver dónde escribir, también con sol de frente.
 */

type PropiedadesDeCampo = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  /** Qué pasó y qué hacer. Nunca «dato inválido» a secas. */
  error?: string;
  /** Una línea de ayuda debajo del campo. */
  ayuda?: string;
};

export function Campo({
  label,
  error,
  ayuda,
  id,
  className = "",
  ...props
}: PropiedadesDeCampo) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const ayudaId = `${inputId}-ayuda`;

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-texto-suave"
      >
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || ayuda ? ayudaId : undefined}
        className={[
          "min-h-14 w-full rounded-xl border bg-fondo px-4 py-3 text-base text-texto",
          "placeholder:text-texto-suave focus:outline-none focus:ring-2 focus:ring-acento-borde",
          error ? "border-rojo-borde" : "border-borde-fuerte focus:border-acento-borde",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
      {error ? (
        <p id={ayudaId} role="alert" className="text-sm leading-6 text-rojo-texto">
          {error}
        </p>
      ) : ayuda ? (
        <p id={ayudaId} className="text-sm leading-6 text-texto-suave">
          {ayuda}
        </p>
      ) : null}
    </div>
  );
}
