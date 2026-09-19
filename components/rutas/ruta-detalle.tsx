"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FeatureCollection } from "geojson";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { borrarRuta } from "@/app/actions/rutas";
import { InsigniasDeActividad } from "@/components/rutas/insignias-de-actividad";
import { BloqueDeCobertura } from "@/components/rutas/bloque-de-cobertura";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { BotonVolver } from "@/components/ui/boton-volver";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useDialogos } from "@/components/ui/dialogos";
import { Avatar } from "@/components/ui/avatar";
import { calcularCobertura, type Cobertura } from "@/lib/cobertura";
import { seSuperponen } from "@/lib/datos/rectangulo";
import { useSectoresConMapaBajado } from "@/hooks/use-mapa-del-sector";
import { leerRecorrido } from "@/lib/offline/recorridos";
import { traerPerfilesPorId } from "@/lib/perfiles/cliente";
import {
  mostrarDesnivel,
  mostrarEsfuerzo,
  mostrarLargo,
} from "@/lib/rutas/actividades";
import type { Perfil, RutaSinRecorrido } from "@/types/database";

/**
 * La ficha de una ruta.
 *
 * **Se lee entera sin señal**, porque es justo lo que hace falta mirar en el
 * cerro: qué llevar, qué complicaciones tiene y por dónde va. Todo sale de lo
 * guardado en el celular. Lo único que necesita internet es el nombre de quien
 * la subió, y si no llega, no pasa nada.
 */

type RutaDetalleProps = {
  rutaId: number;
  miPerfilId: string | null;
};

function fechaCorta(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

const CELDA =
  "rounded-lg border border-borde-suave bg-fondo px-3 py-2";
const ETIQUETA = "text-xs text-texto-suave";
const VALOR = "mt-0.5 text-lg font-semibold tabular-nums text-texto";

export function RutaDetalle({ rutaId, miPerfilId }: RutaDetalleProps) {
  const router = useRouter();
  const { paquete, estado } = useDatosDeLaApp();
  const { confirmar, avisar } = useDialogos();
  const sectoresBajados = useSectoresConMapaBajado();

  const [recorrido, setRecorrido] = useState<FeatureCollection | null>(null);
  const [buscandoRecorrido, setBuscandoRecorrido] = useState(true);
  const [autor, setAutor] = useState<Perfil | null>(null);
  const [borrando, setBorrando] = useState(false);

  const ruta: RutaSinRecorrido | null =
    paquete?.rutas.find((cada) => cada.id === rutaId) ?? null;

  useEffect(() => {
    let vigente = true;

    void (async () => {
      const guardado = await leerRecorrido(rutaId);
      if (!vigente) return;
      setRecorrido(guardado);
      setBuscandoRecorrido(false);
    })();

    return () => {
      vigente = false;
    };
  }, [rutaId]);

  useEffect(() => {
    if (!ruta) return;
    void traerPerfilesPorId([ruta.perfilId]).then((porId) => {
      setAutor(porId[ruta.perfilId] ?? null);
    });
  }, [ruta]);

  if (estado === "abriendo" || buscandoRecorrido) {
    return (
      <Tarjeta className="py-8 text-center text-base text-texto-suave">
        Abriendo la ruta…
      </Tarjeta>
    );
  }

  if (!ruta) {
    return (
      <Tarjeta franja="rojo" className="space-y-3">
        <p role="alert" className="text-base leading-6 text-rojo-texto">
          Esta ruta no está en el celular. Puede que la hayan borrado, o que
          todavía no se haya guardado acá.
        </p>
        <p className="text-sm leading-6 text-texto-suave">
          Con conexión, volvé a la lista y se pone al día sola.
        </p>
        <BotonVolverALaLista />
      </Tarjeta>
    );
  }

  const soyElAutor = miPerfilId !== null && miPerfilId === ruta.perfilId;

  const sectores = paquete?.sectores ?? [];
  const cobertura: Cobertura | null = recorrido
    ? calcularCobertura(recorrido, sectores, sectoresBajados)
    : null;

  // Para ofrecer «crear un sector acá», hace falta saber en qué zona cae.
  const zonaDeLaRuta =
    (paquete?.zonas ?? []).find((zona) =>
      seSuperponen(zona.rectangulo, ruta.rectangulo),
    ) ?? null;

  const alBorrar = async () => {
    const seguro = await confirmar({
      titulo: `¿Borrar «${ruta.nombre}»?`,
      mensaje:
        "La ruta deja de verse en la app. Si te arrepentís, se puede recuperar.",
      textoDeAceptar: "Borrar",
      destructivo: true,
    });
    if (!seguro) return;

    setBorrando(true);
    const resultado = await borrarRuta(ruta.id);
    setBorrando(false);

    if (!resultado.ok) {
      await avisar({ titulo: "No se pudo borrar", mensaje: resultado.error });
      return;
    }

    router.push("/rutas");
  };

  const hayTextos = Boolean(
    ruta.equipo || ruta.complicaciones || ruta.comentario,
  );

  return (
    <div className="space-y-3">
      {estado === "sin_senal" ? (
        <Tarjeta>
          <p className="text-sm font-medium text-texto-suave">
            Sin señal. Estás viendo lo último que quedó guardado en el celular.
          </p>
        </Tarjeta>
      ) : null}

      <Tarjeta className="space-y-3">
        <div className="flex items-start gap-2">
          <BotonVolverALaLista />
          <h1 className="min-w-0 flex-1 break-words pt-3 text-xl font-semibold text-texto">
            {ruta.nombre}
          </h1>
        </div>

        {ruta.descripcion ? (
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-texto-suave">
            {ruta.descripcion}
          </p>
        ) : null}

        <InsigniasDeActividad actividades={ruta.actividades} tamano="mediano" />

        <div className="flex items-center gap-2 border-t border-borde pt-3">
          <Avatar src={autor?.avatarUrl} name={autor?.nombre ?? "?"} size="sm" />
          <p className="text-sm text-texto-suave">
            Subida por{" "}
            <span className="font-medium text-texto">
              {autor?.nombre ?? "alguien de la app"}
            </span>{" "}
            el {fechaCorta(ruta.creadoEn)}
          </p>
        </div>
      </Tarjeta>

      <Tarjeta className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
            Los números
          </h2>
          <span className="text-xs text-texto-suave">
            el largo y los desniveles salen del archivo
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-1.5">
          <div className={CELDA}>
            <dt className={ETIQUETA}>Largo</dt>
            <dd className="mt-0.5 text-lg font-semibold tracking-wide tabular-nums text-dato">
              {mostrarLargo(ruta.largoKm)}
            </dd>
          </div>
          <div className={CELDA}>
            <dt className={ETIQUETA}>Dificultad técnica</dt>
            <dd className={VALOR}>
              {ruta.dificultadTecnica === null ? (
                "—"
              ) : (
                <>
                  {ruta.dificultadTecnica}{" "}
                  <span className="text-sm font-normal text-texto-suave">
                    de 10
                  </span>
                </>
              )}
            </dd>
          </div>
          <div className={CELDA}>
            <dt className={ETIQUETA}>Lo que se sube</dt>
            <dd className={VALOR}>
              {mostrarDesnivel(ruta.desnivelPositivoM, "positivo")}
            </dd>
          </div>
          <div className={CELDA}>
            <dt className={ETIQUETA}>Lo que se baja</dt>
            <dd className={VALOR}>
              {mostrarDesnivel(ruta.desnivelNegativoM, "negativo")}
            </dd>
          </div>
        </dl>

        <div className={CELDA}>
          <div className="flex items-baseline justify-between gap-3">
            <span className={ETIQUETA}>Esfuerzo</span>
            <span className="text-base font-semibold text-texto">
              {ruta.nivelEsfuerzo ? mostrarEsfuerzo(ruta.nivelEsfuerzo) : "—"}
            </span>
          </div>
          <BarraDeEsfuerzo nivel={ruta.nivelEsfuerzo} />
        </div>
      </Tarjeta>

      <Tarjeta className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
          El recorrido
        </h2>
        {recorrido ? (
          <CargadorDeMapa recorrido={recorrido} encuadre={ruta.rectangulo} />
        ) : (
          <p className="rounded-lg border border-borde-suave bg-fondo px-3 py-6 text-center text-sm leading-6 text-texto-suave">
            La línea de esta ruta todavía no está guardada en el celular. Abrí la
            app una vez con conexión y queda guardada sola.
          </p>
        )}
      </Tarjeta>

      {cobertura ? (
        <BloqueDeCobertura
          cobertura={cobertura}
          zonaParaCrearSector={zonaDeLaRuta?.id ?? null}
        />
      ) : null}

      {hayTextos ? (
        <Tarjeta className="space-y-4">
          {ruta.equipo ? (
            <Texto titulo="Qué llevar" cuerpo={ruta.equipo} />
          ) : null}
          {ruta.complicaciones ? (
            <Texto titulo="Complicaciones" cuerpo={ruta.complicaciones} />
          ) : null}
          {ruta.comentario ? (
            <Texto titulo="Comentario" cuerpo={ruta.comentario} />
          ) : null}
        </Tarjeta>
      ) : null}

      <Boton
        anchoCompleto
        paraNavegacion
        disabled={!recorrido}
        onClick={() => router.push(`/navegacion/${ruta.id}`)}
      >
        Navegar esta ruta
      </Boton>

      {soyElAutor ? (
        <div className="flex gap-2 pb-2">
          <Boton
            variante="secundario"
            className="flex-1"
            onClick={() => router.push(`/rutas/${ruta.id}/editar`)}
          >
            Editar
          </Boton>
          <Boton
            variante="destructivo"
            className="flex-1"
            disabled={borrando}
            onClick={() => void alBorrar()}
          >
            {borrando ? "Borrando…" : "Borrar"}
          </Boton>
        </div>
      ) : null}
    </div>
  );
}

function BotonVolverALaLista() {
  return <BotonVolver destinoSiNoHayVuelta="/rutas" etiqueta="Volver a las rutas" />;
}

function Texto({ titulo, cuerpo }: { titulo: string; cuerpo: string }) {
  return (
    <div>
      <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
        {titulo}
      </h2>
      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-texto">
        {cuerpo}
      </p>
    </div>
  );
}

const ESCALON_DE_ESFUERZO = { bajo: 1, medio: 2, alto: 3, muy_alto: 4 } as const;

function BarraDeEsfuerzo({
  nivel,
}: {
  nivel: RutaSinRecorrido["nivelEsfuerzo"];
}) {
  const llenos = nivel ? ESCALON_DE_ESFUERZO[nivel] : 0;

  return (
    <div className="mt-2 flex gap-1" aria-hidden>
      {[1, 2, 3, 4].map((escalon) => (
        <div
          key={escalon}
          className={[
            "h-1.5 flex-1 rounded-full",
            escalon <= llenos ? "bg-acento-hover" : "bg-superficie-alta",
          ].join(" ")}
        />
      ))}
    </div>
  );
}
