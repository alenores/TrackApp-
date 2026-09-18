"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { BotonDeModal, Modal } from "@/components/ui/modal";

/**
 * Confirmar y avisar, dibujados por la app.
 *
 * **Prohibido `window.confirm`, `window.alert` y `window.prompt`.** Los dibuja
 * el sistema operativo: rompen el diseño, el navegador los puede bloquear
 * («no permitir más diálogos») y no dejan lugar para explicar qué hacer.
 *
 * Además, con pantalla mojada aparecen toques fantasma: por eso toda acción que
 * borra o cancela algo pasa por `confirmar`.
 */

type PedidoDeConfirmacion = {
  titulo: string;
  mensaje?: string;
  textoDeAceptar?: string;
  textoDeCancelar?: string;
  /** `true` cuando lo que se confirma borra algo. Pinta el botón de rojo. */
  destructivo?: boolean;
};

type PedidoDeAviso = {
  titulo: string;
  mensaje?: string;
  textoDeAceptar?: string;
};

type Dialogos = {
  confirmar: (pedido: PedidoDeConfirmacion) => Promise<boolean>;
  avisar: (pedido: PedidoDeAviso) => Promise<void>;
};

const ContextoDeDialogos = createContext<Dialogos | null>(null);

type Estado =
  | { clase: "cerrado" }
  | {
      clase: "confirmar";
      pedido: PedidoDeConfirmacion;
      responder: (acepto: boolean) => void;
    }
  | { clase: "avisar"; pedido: PedidoDeAviso; responder: () => void };

export function ProveedorDeDialogos({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>({ clase: "cerrado" });

  const confirmar = useCallback(
    (pedido: PedidoDeConfirmacion) =>
      new Promise<boolean>((resolver) => {
        setEstado({
          clase: "confirmar",
          pedido,
          responder: (acepto) => {
            setEstado({ clase: "cerrado" });
            resolver(acepto);
          },
        });
      }),
    [],
  );

  const avisar = useCallback(
    (pedido: PedidoDeAviso) =>
      new Promise<void>((resolver) => {
        setEstado({
          clase: "avisar",
          pedido,
          responder: () => {
            setEstado({ clase: "cerrado" });
            resolver();
          },
        });
      }),
    [],
  );

  const valor = useMemo(() => ({ confirmar, avisar }), [confirmar, avisar]);

  return (
    <ContextoDeDialogos.Provider value={valor}>
      {children}

      <Modal
        abierto={estado.clase === "confirmar"}
        alCerrar={() =>
          estado.clase === "confirmar" ? estado.responder(false) : undefined
        }
        titulo={estado.clase === "confirmar" ? estado.pedido.titulo : ""}
        descripcion={
          estado.clase === "confirmar" ? estado.pedido.mensaje : undefined
        }
        acciones={
          estado.clase === "confirmar" ? (
            <>
              <BotonDeModal
                variante="secundario"
                onClick={() => estado.responder(false)}
              >
                {estado.pedido.textoDeCancelar ?? "Cancelar"}
              </BotonDeModal>
              <BotonDeModal
                variante={estado.pedido.destructivo ? "destructivo" : "principal"}
                onClick={() => estado.responder(true)}
              >
                {estado.pedido.textoDeAceptar ?? "Confirmar"}
              </BotonDeModal>
            </>
          ) : null
        }
      />

      <Modal
        abierto={estado.clase === "avisar"}
        alCerrar={() =>
          estado.clase === "avisar" ? estado.responder() : undefined
        }
        titulo={estado.clase === "avisar" ? estado.pedido.titulo : ""}
        descripcion={estado.clase === "avisar" ? estado.pedido.mensaje : undefined}
        acciones={
          estado.clase === "avisar" ? (
            <BotonDeModal variante="principal" onClick={estado.responder}>
              {estado.pedido.textoDeAceptar ?? "Entendido"}
            </BotonDeModal>
          ) : null
        }
      />
    </ContextoDeDialogos.Provider>
  );
}

/**
 * Si el proveedor no está puesto, cae al cartel del navegador: feo, pero
 * visible. Un aviso que no aparece es peor que uno feo.
 */
export function useDialogos(): Dialogos {
  const contexto = useContext(ContextoDeDialogos);

  return useMemo<Dialogos>(() => {
    if (contexto) return contexto;

    return {
      confirmar: async (pedido) =>
        window.confirm(
          [pedido.titulo, pedido.mensaje].filter(Boolean).join("\n\n"),
        ),
      avisar: async (pedido) => {
        window.alert(
          [pedido.titulo, pedido.mensaje].filter(Boolean).join("\n\n"),
        );
      },
    };
  }, [contexto]);
}
