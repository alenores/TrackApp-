"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type NavigationExitModalProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function NavigationExitModal({
  open,
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
        className="absolute inset-0 bg-black/60"
        onClick={onCancel}
      />

      <Card className="relative z-10 w-full max-w-sm space-y-4 shadow-xl">
        <div className="space-y-2">
          <h2
            id="navigation-exit-title"
            className="text-lg font-bold text-foreground"
          >
            ¿Salir de la navegación?
          </h2>
          <p id="navigation-exit-description" className="text-sm leading-6 text-muted">
            Tu posición GPS se desactivará
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button type="button" fullWidth onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" fullWidth onClick={onConfirm}>
            Salir
          </Button>
        </div>
      </Card>
    </div>
  );
}
