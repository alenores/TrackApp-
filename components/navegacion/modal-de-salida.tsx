"use client";

import { Emergente, BotonDeEmergente } from "@/components/ui/emergente";

type NavigationExitModalProps = {
  open: boolean;
  /** La pregunta del cartel. Por defecto, la de navegar una ruta. */
  titulo?: string;
  onCancel: () => void;
  onConfirm: () => void;
  /**
   * Hay una salida registrándose. Salir tiene dos caminos: terminarla (queda
   * el borrador para subir) o dejarla en curso para seguir en la próxima.
   */
  registrando?: boolean;
  alTerminarYSalir?: () => void;
};

export function ModalDeSalida({
  open,
  titulo = "¿Salir de la navegación?",
  onCancel,
  onConfirm,
  registrando = false,
  alTerminarYSalir,
}: NavigationExitModalProps) {
  return (
    <Emergente
      abierto={open}
      alCerrar={onCancel}
      titulo={titulo}
      acciones={
        <div className="flex w-full flex-col gap-2">
          <BotonDeEmergente variante="principal" onClick={onCancel}>
            Cancelar
          </BotonDeEmergente>
          {registrando && alTerminarYSalir ? (
            <>
              <BotonDeEmergente onClick={alTerminarYSalir}>
                Terminar la salida y salir
              </BotonDeEmergente>
              <BotonDeEmergente onClick={onConfirm}>
                Salir y seguirla después
              </BotonDeEmergente>
            </>
          ) : (
            <BotonDeEmergente variante="destructivo" onClick={onConfirm}>
              Salir
            </BotonDeEmergente>
          )}
        </div>
      }
    >
      <p className="text-base leading-6 text-texto-suave">
        {registrando
          ? "Estás registrando una salida. Si la terminás, queda un borrador que se sube solo cuando haya señal. Si la seguís después, se retoma la próxima vez que navegues."
          : "Tu posición GPS se desactivará"}
      </p>
    </Emergente>
  );
}
