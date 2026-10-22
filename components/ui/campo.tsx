import type { InputHTMLAttributes } from "react";
import { MarcaDeObligatorio } from "@/components/ui/marca-de-obligatorio";

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
  /** `true` para el asterisco rojo de dato obligatorio. */
  obligatorio?: boolean;
  /** `true` cuando el campo se explica solo: el rótulo queda para el lector de pantalla. */
  etiquetaOculta?: boolean;
};

export function Campo({
  label,
  error,
  ayuda,
  obligatorio = false,
  etiquetaOculta = false,
  id,
  type,
  className = "",
  ...props
}: PropiedadesDeCampo) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const ayudaId = `${inputId}-ayuda`;
  const esFecha = type === "date";

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className={etiquetaOculta ? "sr-only" : "block text-sm font-medium text-texto-suave"}
      >
        {label}
        {obligatorio ? <MarcaDeObligatorio /> : null}
      </label>
      <input
        id={inputId}
        type={type}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || ayuda ? ayudaId : undefined}
        className={[
          "min-h-14 rounded-xl border bg-fondo px-4 py-3 text-base text-texto",
          esFecha ? "w-44 max-w-full" : "w-full",
          "placeholder:text-texto-suave/50 focus:outline-none focus:ring-2 focus:ring-acento-borde",
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
