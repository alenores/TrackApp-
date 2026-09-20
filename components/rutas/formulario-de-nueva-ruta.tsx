"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { crearRuta } from "@/app/actions/rutas";
import { useDatosDeLaApp } from "@/hooks/use-datos-de-la-app";
import { BloqueDeCobertura } from "@/components/rutas/bloque-de-cobertura";
import {
  CamposDeRuta,
  CAMPOS_VACIOS,
  type CamposDeLaRuta,
} from "@/components/rutas/campos-de-ruta";
import { BotonVolver } from "@/components/ui/boton-volver";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { calcularCobertura } from "@/lib/cobertura";
import { seSuperponen } from "@/lib/datos/rectangulo";
import {
  useMapasBajados,
  useSectoresConMapaBajado,
} from "@/hooks/use-mapa-del-sector";
import {
  FORMATOS_ACEPTADOS,
  leerArchivoDeRuta,
  type RecorridoLeido,
} from "@/lib/rutas/archivo";
import { mostrarDesnivel, mostrarLargo } from "@/lib/rutas/actividades";

/**
 * Subir una ruta.
 *
 * Dos cosas mandan en esta pantalla:
 *
 * 1. **El largo y los desniveles salen del archivo, no se escriben.** Un número
 *    tipeado a mano se equivoca y nadie se entera hasta que falta agua.
 * 2. **Acá se avisa si falta bajar un mapa.** Este es el momento en que el
 *    usuario todavía tiene señal y está en su casa. Enterarse a mitad de camino
 *    no es un aviso: es una sorpresa.
 */

export function FormularioDeNuevaRuta() {
  const router = useRouter();
  const { paquete } = useDatosDeLaApp();
  const entradaDeArchivo = useRef<HTMLInputElement>(null);

  const [archivo, setArchivo] = useState<File | null>(null);
  const [recorrido, setRecorrido] = useState<RecorridoLeido | null>(null);
  const [errorDelArchivo, setErrorDelArchivo] = useState<string | null>(null);
  const [leyendo, setLeyendo] = useState(false);

  const [campos, setCampos] = useState<CamposDeLaRuta>(CAMPOS_VACIOS);
  const [guardando, setGuardando] = useState(false);
  const [errorAlGuardar, setErrorAlGuardar] = useState<string | null>(null);

  const alElegirArchivo = async (elegido: File | null) => {
    setErrorDelArchivo(null);
    setRecorrido(null);
    setArchivo(elegido);

    if (!elegido) return;

    setLeyendo(true);
    const lectura = await leerArchivoDeRuta(elegido);
    setLeyendo(false);

    if (!lectura.ok) {
      setErrorDelArchivo(lectura.error);
      setArchivo(null);
      return;
    }

    setRecorrido(lectura.recorrido);

    // El nombre del archivo suele ser el mejor punto de partida.
    if (!campos.nombre.trim()) {
      const sinExtension = elegido.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      setCampos((actuales) => ({ ...actuales, nombre: sinExtension }));
    }
  };

  const alGuardar = async () => {
    setErrorAlGuardar(null);

    if (!recorrido || !archivo) {
      setErrorAlGuardar("Elegí primero el archivo del recorrido.");
      return;
    }

    setGuardando(true);
    const resultado = await crearRuta(
      {
        nombre: campos.nombre,
        descripcion: campos.descripcion || null,
        comentario: campos.comentario || null,
        actividades: campos.actividades,
        dificultadTecnica: campos.dificultadTecnica,
        nivelEsfuerzo: campos.nivelEsfuerzo,
        equipo: campos.equipo || null,
        complicaciones: campos.complicaciones || null,
      },
      recorrido.geometria,
      archivo,
    );
    setGuardando(false);

    if (!resultado.ok) {
      setErrorAlGuardar(resultado.error);
      return;
    }

    router.push(`/rutas/${resultado.datos.rutaId}`);
  };

  const sectoresBajados = useSectoresConMapaBajado();
  const mapasBajados = useMapasBajados();
  const sectores = paquete?.sectores ?? [];
  const cobertura = recorrido
    ? calcularCobertura(recorrido.geometria, sectores, sectoresBajados)
    : null;

  const zonaDeLaRuta = recorrido
    ? (paquete?.zonas ?? []).find((zona) =>
        seSuperponen(zona.rectangulo, recorrido.rectangulo),
      ) ?? null
    : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BotonVolver destinoSiNoHayVuelta="/rutas" etiqueta="Volver a las rutas" />
        <h1 className="text-xl font-semibold text-texto">Subir una ruta</h1>
      </div>

      <Tarjeta className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
          El archivo
        </h2>

        <input
          ref={entradaDeArchivo}
          id="archivo-de-la-ruta"
          type="file"
          accept={FORMATOS_ACEPTADOS}
          className="sr-only"
          onChange={(evento) => {
            void alElegirArchivo(evento.target.files?.[0] ?? null);
          }}
        />

        {archivo && recorrido ? (
          <div className="flex items-center gap-3 rounded-xl border border-borde-fuerte bg-fondo px-3 py-3">
            <IconoDeArchivo />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-texto">
                {archivo.name}
              </p>
              <p className="mt-0.5 text-xs text-texto-suave">
                {recorrido.puntos.toLocaleString("es-AR")} puntos leídos
              </p>
            </div>
            <Boton
              variante="secundario"
              className="px-4 text-sm"
              onClick={() => entradaDeArchivo.current?.click()}
            >
              Cambiar
            </Boton>
          </div>
        ) : (
          <Boton
            anchoCompleto
            variante="secundario"
            disabled={leyendo}
            onClick={() => entradaDeArchivo.current?.click()}
          >
            {leyendo ? "Leyendo el archivo…" : "Elegir el archivo .gpx o .kml"}
          </Boton>
        )}

        {errorDelArchivo ? (
          <div className="flex items-start gap-2 rounded-xl border border-rojo-borde bg-rojo-fondo px-3 py-3">
            <p role="alert" className="text-sm leading-6 text-rojo-texto">
              {errorDelArchivo}
            </p>
          </div>
        ) : null}

        {recorrido ? (
          <div className="rounded-xl border border-borde-suave bg-fondo px-3 py-3">
            <p className="mb-2 text-xs text-texto-suave">
              Esto lo sacó la app del archivo. No se escribe a mano.
            </p>
            <dl className="grid grid-cols-3 gap-3">
              <div>
                <dt className="text-xs text-texto-suave">Largo</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums text-dato">
                  {mostrarLargo(recorrido.largoKm)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-texto-suave">Se sube</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums text-texto">
                  {mostrarDesnivel(recorrido.desnivelPositivoM, "positivo")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-texto-suave">Se baja</dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums text-texto">
                  {mostrarDesnivel(recorrido.desnivelNegativoM, "negativo")}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}
      </Tarjeta>

      {cobertura ? (
        <BloqueDeCobertura
          cobertura={cobertura}
          anotaciones={paquete?.anotaciones ?? []}
          mapasBajados={mapasBajados}
          zonaParaCrearSector={zonaDeLaRuta?.id ?? null}
        />
      ) : null}

      <CamposDeRuta campos={campos} alCambiar={setCampos} />

      {errorAlGuardar ? (
        <Tarjeta franja="rojo">
          <p role="alert" className="text-sm leading-6 text-rojo-texto">
            {errorAlGuardar}
          </p>
        </Tarjeta>
      ) : null}

      <div className="pb-2">
        <Boton
          anchoCompleto
          paraNavegacion
          disabled={guardando || !recorrido}
          onClick={() => void alGuardar()}
        >
          {guardando ? "Guardando…" : "Guardar la ruta"}
        </Boton>
      </div>
    </div>
  );
}

function IconoDeArchivo() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-6 w-6 shrink-0 text-acento-tenue"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}
