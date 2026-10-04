"use client";

import { BotonDeEmergente, Emergente } from "@/components/ui/emergente";
import { BotonRedondo } from "@/components/ui/boton-redondo";

/**
 * Lo que se ve del registro de una salida en los mapas del cerro: la franja
 * que dice que se está registrando, el botón «Marcar acá» y la pregunta para
 * empezar.
 *
 * Letra de 18 o más, como pide la pantalla de navegación; botones del tamaño
 * normal (decisión 024).
 */

/** «● Registrando · 6,2 km · 34 puntos». Va abajo, arriba de los botones. */
export function FranjaDeRegistro({
  kilometros,
  puntos,
  marcaRecien,
  error,
}: {
  kilometros: number;
  puntos: number;
  marcaRecien: boolean;
  error: string | null;
}) {
  return (
    <div className="pointer-events-auto space-y-2">
      {error ? (
        <p role="alert" className="rounded-xl border border-rojo-borde bg-superficie p-2 text-lg leading-7 text-rojo-texto">
          {error}
        </p>
      ) : null}
      <p
        role="status"
        className="flex items-center justify-center gap-2 rounded-full border border-borde bg-superficie px-3 py-1.5 text-lg text-texto"
      >
        <span aria-hidden className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-rojo" />
        {marcaRecien
          ? "Punto marcado"
          : `Registrando · ${kilometros.toFixed(1).replace(".", ",")} km · ${puntos} ${puntos === 1 ? "punto" : "puntos"}`}
      </p>
    </div>
  );
}

/** La banderita: suma a mano un punto donde estás. */
export function BotonMarcarAca({ alTocar, deshabilitado }: { alTocar: () => void; deshabilitado: boolean }) {
  return (
    <BotonRedondo etiqueta="Marcar acá en la salida" onClick={alTocar} disabled={deshabilitado}>
      <path d="M6 21V4m0 0h10l-2 3.5 2 3.5H6" />
    </BotonRedondo>
  );
}

/** El botón para empezar a registrar desde la navegación libre. */
export function BotonEmpezarARegistrar({ alTocar }: { alTocar: () => void }) {
  return (
    <BotonRedondo etiqueta="Registrar una salida" onClick={alTocar}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3.5" fill="currentColor" />
    </BotonRedondo>
  );
}

/**
 * La pregunta de si registrar la salida. Tres caminos: registrar, solo
 * navegar, o cerrar la pregunta (no pasa nada).
 */
export function PreguntaDeRegistrar({
  abierta,
  alCerrar,
  alRegistrar,
  alSoloNavegar,
  textoDeSoloNavegar = "Solo navegar",
}: {
  abierta: boolean;
  alCerrar: () => void;
  alRegistrar: () => void;
  alSoloNavegar: () => void;
  textoDeSoloNavegar?: string;
}) {
  return (
    <Emergente
      abierto={abierta}
      alCerrar={alCerrar}
      titulo="¿Registrás esta salida?"
      acciones={
        <>
          <BotonDeEmergente onClick={alSoloNavegar}>{textoDeSoloNavegar}</BotonDeEmergente>
          <BotonDeEmergente variante="principal" onClick={alRegistrar}>
            Sí, registrar
          </BotonDeEmergente>
        </>
      }
    >
      <div className="space-y-2 text-base leading-6 text-texto">
        <p>
          Mientras navegás se va anotando por dónde vas, sin señal. Con la banderita marcás un
          punto a mano.
        </p>
        <p className="text-texto-suave">
          Con el celular bloqueado no se anota: ese tramo queda como una línea recta. Al terminar
          queda un borrador que solo ves vos, para completarlo y publicarlo cuando quieras.
        </p>
      </div>
    </Emergente>
  );
}
