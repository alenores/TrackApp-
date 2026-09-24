"use client";

import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";

type NavigationExitModalProps = {
  open: boolean;
  /** La pregunta del cartel. Por defecto, la de navegar una ruta. */
  titulo?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ModalDeSalida({
  open,
  titulo = "¿Salir de la navegación?",
  onCancel,
  onConfirm,
}: NavigationExitModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="navigation-exit-title"
      aria-describedby="navigation-exit-description"
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-velo"
        onClick={onCancel}
      />

      <Tarjeta className="relative z-10 w-full max-w-sm space-y-4 shadow-xl">
        <div className="space-y-2">
          <h2
            id="navigation-exit-title"
            className="text-lg font-bold text-texto"
          >
            {titulo}
          </h2>
          <p id="navigation-exit-description" className="text-sm leading-6 text-texto-suave">
            Tu posición GPS se desactivará
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Boton type="button" anchoCompleto onClick={onCancel}>
            Cancelar
          </Boton>
          <Boton type="button" variante="destructivo" anchoCompleto onClick={onConfirm}>
            Salir
          </Boton>
        </div>
      </Tarjeta>
    </div>
  );
}
