import type { TextareaHTMLAttributes } from "react";

/**
 * Un campo de texto de varios renglones.
 *
 * Mismo contorno y mismos colores que el campo de una línea: **no se arma uno
 * nuevo escribiendo clases a mano**.
 */

type AreaDeTextoProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  ayuda?: string;
  error?: string;
};

export function AreaDeTexto({
  label,
  ayuda,
  error,
  id,
  className = "",
  rows = 3,
  ...props
}: AreaDeTextoProps) {
  const campoId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const ayudaId = `${campoId}-ayuda`;

  return (
    <div className="space-y-2">
      <label
        htmlFor={campoId}
        className="block text-sm font-medium text-texto-suave"
      >
        {label}
      </label>
      <textarea
        id={campoId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || ayuda ? ayudaId : undefined}
        className={[
          "w-full rounded-xl border bg-fondo px-4 py-3 text-base leading-6 text-texto",
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
