"use client";

import { Boton } from "@/components/ui/boton";
import { useDialogos } from "@/components/ui/dialogos";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useRegistros } from "@/hooks/use-registros";
import { terminarElRegistro } from "@/lib/salidas/registro";
import { kilometrosRegistrados } from "@/lib/salidas/registro-reglas";

/**
 * Lo registrado navegando que todavía está en el celular: la salida en curso y
 * las terminadas que esperan para subirse. **El usuario nunca se queda sin
 * saber qué pasa**: si una no sube, se dice por qué.
 */
export function AvisoDeRegistros() {
  const registros = useRegistros();
  const { confirmar, avisar } = useDialogos();
  if (registros.length === 0) return null;

  const alTerminar = async () => {
    const seguro = await confirmar({
      titulo: "¿Terminar la salida?",
      mensaje:
        "Deja de registrarse. Lo registrado hasta ahora queda como borrador y se sube solo con señal.",
      textoDeAceptar: "Terminar la salida",
    });
    if (!seguro) return;
    try {
      await terminarElRegistro();
    } catch (causa) {
      await avisar({
        titulo: "No se pudo terminar la salida",
        mensaje: `${causa instanceof Error ? causa.message : String(causa)}. Probá de nuevo.`,
      });
    }
  };

  const enCurso = registros.find((cada) => cada.terminadoEn === null);
  const esperando = registros.filter((cada) => cada.terminadoEn !== null);
  const conProblema = esperando.filter((cada) => cada.ultimoError);

  return (
    <div className="space-y-3">
      {enCurso ? (
        <Tarjeta franja="verde" className="space-y-3">
          <p className="text-base leading-6 text-texto">
            Tenés una salida registrándose
            {(enCurso.nombreDelCircuito ?? enCurso.nombreDeLaRuta) ? ` en «${enCurso.nombreDelCircuito ?? enCurso.nombreDeLaRuta}»` : ""}:{" "}
            {kilometrosRegistrados(enCurso.puntos).toFixed(1).replace(".", ",")} km hasta ahora. Se
            sigue al volver a navegar, y la terminás al salir del mapa o acá.
          </p>
          {/* Si nunca se vuelve a navegar, tiene que haber cómo terminarla. */}
          <Boton variante="secundario" onClick={() => void alTerminar()}>
            Terminar esta salida
          </Boton>
        </Tarjeta>
      ) : null}

      {esperando.length > 0 ? (
        <Tarjeta franja={conProblema.length > 0 ? "ambar" : undefined} className="space-y-2">
          <p className="text-base leading-6 text-texto">
            {esperando.length === 1
              ? "Una salida registrada espera para subirse."
              : `${esperando.length} salidas registradas esperan para subirse.`}{" "}
            Se suben solas con señal, como borrador.
          </p>
          {conProblema.map((cada) => (
            <p key={cada.codigo} role="alert" className="text-sm leading-6 text-ambar-texto">
              La última vez no subió: {cada.ultimoError}. Se vuelve a intentar sola.
            </p>
          ))}
        </Tarjeta>
      ) : null}
    </div>
  );
}
