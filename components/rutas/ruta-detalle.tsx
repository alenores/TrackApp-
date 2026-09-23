"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FeatureCollection } from "geojson";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { usePuedeAdministrar } from "@/hooks/use-puede-administrar";
import { borrarRuta } from "@/app/actions/rutas";
import { InsigniasDeActividad } from "@/components/rutas/insignias-de-actividad";
import { IndicadorTecnica, VelocimetroEsfuerzo } from "@/components/rutas/tarjeta-de-ruta";
import { BloqueDeCobertura } from "@/components/rutas/bloque-de-cobertura";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { BotonVolver } from "@/components/ui/boton-volver";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { useDialogos } from "@/components/ui/dialogos";
import { Avatar } from "@/components/ui/avatar";
import { ReferenciaDelMapa } from "@/components/mapa/referencia-del-mapa";
import { calcularCobertura, type Cobertura } from "@/lib/cobertura";
import {
  clasesDibujadas,
  zonasQueCruza,
  etiquetaDeSector,
  type RectanguloEnElMapa,
} from "@/lib/mapas/rectangulos";
import {
  useMapasBajados,
  useSectoresConMapaBajado,
} from "@/hooks/use-mapa-del-sector";
import { leerRecorrido } from "@/lib/offline/recorridos";
import { traerPerfilesPorId } from "@/lib/perfiles/cliente";
import {
  mostrarDesnivel,
  mostrarEsfuerzo,
  mostrarLargo,
} from "@/lib/rutas/actividades";
import type { Perfil, RutaSinRecorrido } from "@/types/database";
import type { TipoDeFondo } from "@/components/mapa/capas-base";
import { useRutasEnArea } from "@/hooks/use-rutas-en-area";
import { SelectorDeRutasEnMapa } from "@/components/zonas/selector-de-rutas-en-mapa";
import { ponerAlDiaDespuesDeGuardar } from "@/lib/offline/puesta-al-dia";

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
  const puedeAdministrar = usePuedeAdministrar(miPerfilId !== null);
  const { confirmar, avisar } = useDialogos();
  const sectoresBajados = useSectoresConMapaBajado();
  const mapasBajados = useMapasBajados();

  const [recorrido, setRecorrido] = useState<FeatureCollection | null>(null);
  const [buscandoRecorrido, setBuscandoRecorrido] = useState(true);
  const [autor, setAutor] = useState<Perfil | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [fondoElegido, setFondoElegido] = useState<TipoDeFondo>("dibujo");

  const ruta: RutaSinRecorrido | null =
    paquete?.rutas.find((cada) => cada.id === rutaId) ?? null;

  const { rutasCruzadas, idsEncendidos, toggleRuta, recorridoCombinado } =
    useRutasEnArea(ruta?.rectangulo || { latNorte: 0, latSur: 0, lonEste: 0, lonOeste: 0 }, ruta?.id);

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

  const soyElAutor = puedeAdministrar && miPerfilId === ruta.perfilId;

  const sectores = paquete?.sectores ?? [];
  const cobertura: Cobertura | null = recorrido
    ? calcularCobertura(recorrido, sectores, sectoresBajados)
    : null;

  // Para ofrecer «crear un sector acá», hace falta saber en qué zona cae.
  const zonas = zonasQueCruza(ruta.rectangulo, paquete?.zonas ?? []);
  const zonaDeLaRuta = zonas[0] ?? null;

  // Lo que se dibuja encima de la ruta: TODAS las zonas y TODOS los sectores
  // para dar contexto completo cuando se amplía el mapa.
  const rectangulosZonas: RectanguloEnElMapa[] = (paquete?.zonas ?? []).map((zona) => ({
    rectangulo: zona.rectangulo,
    clase: "zona" as const,
  }));
  const rectangulosSectores: RectanguloEnElMapa[] = sectores.map((sector) => ({
    rectangulo: sector.rectangulo,
    clase: sectoresBajados.has(sector.id) ? "sector_bajado" as const : "sector_sin_bajar" as const,
    etiqueta: etiquetaDeSector(sector.nombre),
  }));
  const rectangulos = [...rectangulosZonas, ...rectangulosSectores];

  const recorridoCompletoMapa: FeatureCollection | null =
    recorrido && recorridoCombinado
      ? {
          type: "FeatureCollection",
          features: [...recorrido.features, ...recorridoCombinado.features],
        }
      : recorrido || recorridoCombinado;

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

    // Lo que acabás de guardar tiene que aparecer ya, sin cerrar la app.
    void ponerAlDiaDespuesDeGuardar();
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

      <div>
        <div className="flex items-center gap-3">
          <BotonVolverALaLista />
          <h1 className="min-w-0 flex-1 truncate text-2xl font-bold uppercase text-texto">
            {ruta.nombre}
          </h1>
        </div>

        <div className="mt-5 px-1 text-sm text-texto-suave">
          {ruta.descripcion ? (
            <p className="whitespace-pre-wrap break-words mb-4 text-base leading-6 text-texto-suave">
              {ruta.descripcion}
            </p>
          ) : null}

          <div className="flex flex-col gap-4">
            <InsigniasDeActividad actividades={ruta.actividades} tamano="mediano" />

            <div className="flex items-center gap-2">
              <Avatar src={autor?.avatarUrl} name={autor?.nombre ?? "?"} size="sm" />
              <p className="text-sm text-texto-suave">
                Subida por{" "}
                <span className="font-medium text-texto">
                  {autor?.nombre ?? "alguien de la app"}
                </span>{" "}
                el {fechaCorta(ruta.creadoEn)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tarjeta className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
            Datos de la ruta
          </h2>
        </div>

        <dl className="flex flex-col gap-1.5">
          <div className={`${CELDA} flex flex-col items-center justify-center py-4`}>
            <dt className={ETIQUETA}>Largo</dt>
            <dd className="mt-1 text-3xl font-bold tracking-wide tabular-nums text-cyan-300 [text-shadow:0_0_10px_rgba(103,232,249,0.22)]">
              {mostrarLargo(ruta.largoKm)}
            </dd>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div className={CELDA}>
              <dt className={`${ETIQUETA} text-center`}>Dificultad técnica</dt>
              <dd className="mt-2.5 flex items-center justify-center h-6">
                <IndicadorTecnica tecnica={ruta.dificultadTecnica} />
              </dd>
            </div>
            <div className={CELDA}>
              <dt className={`${ETIQUETA} text-center`}>Esfuerzo</dt>
              <dd className="mt-1 flex items-center justify-center h-6">
                <VelocimetroEsfuerzo esfuerzo={ruta.nivelEsfuerzo} />
              </dd>
            </div>
            <div className={CELDA}>
              <dt className={`${ETIQUETA} text-center`}>Lo que se sube</dt>
              <dd className={`${VALOR} flex items-center justify-center gap-1 text-verde-texto`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>
                {mostrarDesnivel(ruta.desnivelPositivoM, "positivo")}
              </dd>
            </div>
            <div className={CELDA}>
              <dt className={`${ETIQUETA} text-center`}>Lo que se baja</dt>
              <dd className={`${VALOR} flex items-center justify-center gap-1 text-ambar-texto`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 7v10H7"/><path d="M17 17 7 7"/></svg>
                {mostrarDesnivel(ruta.desnivelNegativoM, "negativo")}
              </dd>
            </div>
          </div>
        </dl>
      </Tarjeta>

      {hayTextos ? (
        <Tarjeta className="space-y-4">
          {ruta.equipo ? (
            <Texto 
              titulo="Qué llevar" 
              cuerpo={ruta.equipo} 
              icono={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9"/><path d="M10 2v2"/><path d="M14 2v2"/><path d="M7 22v-9a5 5 0 0 1 10 0v9"/><path d="M9 6h6"/></svg>}
            />
          ) : null}
          {ruta.complicaciones ? (
            <Texto 
              titulo="Complicaciones" 
              cuerpo={ruta.complicaciones} 
              icono={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ambar-texto"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>}
            />
          ) : null}
          {ruta.comentario ? (
            <Texto 
              titulo="Comentario" 
              cuerpo={ruta.comentario} 
              icono={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></svg>}
            />
          ) : null}
        </Tarjeta>
      ) : null}

      {cobertura ? (
        <BloqueDeCobertura
          cobertura={cobertura}
          anotaciones={paquete?.anotaciones ?? []}
          mapasBajados={mapasBajados}
          zonas={zonas}
          zonaParaCrearSector={zonaDeLaRuta?.id ?? null}
        />
      ) : null}



      <Tarjeta className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
          El recorrido
        </h2>
        {recorrido ? (
          <CargadorDeMapa
            recorrido={recorridoCompletoMapa}
            encuadre={ruta.rectangulo}
            rectangulos={rectangulos}
            anotaciones={paquete?.anotaciones ?? []}
            enVivo
            fondoInicial={fondoElegido}
            alCambiarFondo={setFondoElegido}
            controlesAdicionales={
              <SelectorDeRutasEnMapa
                rutasCruzadas={rutasCruzadas}
                idsEncendidos={idsEncendidos}
                toggleRuta={toggleRuta}
              />
            }
            referencia={
              <ReferenciaDelMapa ruta clases={clasesDibujadas(rectangulos)} />
            }
          />
        ) : (
          <p className="rounded-lg border border-borde-suave bg-fondo px-3 py-6 text-center text-sm leading-6 text-texto-suave">
            La línea de esta ruta todavía no está guardada en el celular. Abrí la
            app una vez con conexión y queda guardada sola.
          </p>
        )}
      </Tarjeta>

      <div className="flex justify-center">
        <Boton
          paraNavegacion
          className="flex items-center gap-2 px-6"
          onClick={() => router.push(`/navegacion/${ruta.id}?fondo=${fondoElegido}${idsEncendidos.length > 0 ? `&rutas=${idsEncendidos.join(",")}` : ""}`)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
          Navegar esta ruta
        </Boton>
      </div>
    </div>
  );
}

function BotonVolverALaLista() {
  return <BotonVolver destinoSiNoHayVuelta="/rutas" etiqueta="Volver a las rutas" />;
}

function Texto({ titulo, cuerpo, icono }: { titulo: string; cuerpo: string, icono: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-superficie-alta p-4 border border-borde/50">
      <div className="mt-0.5 text-texto-suave">
        {icono}
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
          {titulo}
        </h2>
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-texto">
          {cuerpo}
        </p>
      </div>
    </div>
  );
}


