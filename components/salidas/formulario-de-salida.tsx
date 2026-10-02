"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AreaDeTexto } from "@/components/ui/area-de-texto";
import { Boton } from "@/components/ui/boton";
import { BotonVolver } from "@/components/ui/boton-volver";
import { Campo } from "@/components/ui/campo";
import { useDialogos } from "@/components/ui/dialogos";
import { Opciones, type Opcion } from "@/components/ui/opciones";
import { Tarjeta } from "@/components/ui/tarjeta";
import { SelectorDeFoto } from "@/components/fotos/selector-de-foto";
import { FORMAS_DE_RECORTE } from "@/components/fotos/recorte-de-foto";
import { useFoto } from "@/hooks/use-foto";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { ACTIVIDADES, mostrarEsfuerzo } from "@/lib/rutas/actividades";
import { FORMATOS_ACEPTADOS, leerArchivoDeRuta } from "@/lib/rutas/archivo";
import { guardarSalida } from "@/lib/salidas/guardar";
import { hoyEnCordoba, leerNumero, LARGO_MAXIMO_DEL_TITULO } from "@/lib/salidas/reglas";
import { crearClienteEnElNavegador } from "@/lib/supabase/navegador";
import {
  ACTIVIDADES_RUTA,
  NIVELES_ESFUERZO,
  type ActividadRuta,
  type NivelEsfuerzo,
  type Perfil,
} from "@/types/database";

/**
 * Cargar una salida. **Solo con internet**, como todo el módulo.
 *
 * Si se sube el archivo GPS, el largo y los desniveles salen de ahí y no se
 * escriben: igual que en rutas, un número tipeado a mano se equivoca. Sin
 * archivo, se pueden escribir.
 *
 * Si la señal se va mientras se completa, lo escrito queda en pantalla y el
 * botón de guardar se traba hasta que vuelva.
 */

type Props = {
  /** Los demás usuarios, para elegir con quién fuiste. */
  perfiles: Perfil[];
  avisoDeListaIncompleta: string | null;
};

const OPCIONES_DE_ACTIVIDAD: Opcion<ActividadRuta>[] = ACTIVIDADES_RUTA.map((tipo) => {
  const actividad = ACTIVIDADES.find((cada) => cada.tipo === tipo);
  return { valor: tipo, etiqueta: actividad?.etiqueta ?? tipo, trazo: actividad?.trazo };
});

const OPCIONES_DE_ESFUERZO: Opcion<NivelEsfuerzo>[] = NIVELES_ESFUERZO.map((nivel) => ({
  valor: nivel,
  etiqueta: mostrarEsfuerzo(nivel),
}));

const ETIQUETAS_DE_FOTO = ["Elegir la portada", "Sumar otra foto", "Sumar otra foto", "Sumar otra foto"];

type NumerosDelArchivo = { largoKm: number; desnivelPositivoM: number; desnivelNegativoM: number };

export function FormularioDeSalida({ perfiles, avisoDeListaIncompleta }: Props) {
  const router = useRouter();
  const haySenal = useHaySenal();
  const { avisar } = useDialogos();
  const entradaDeArchivo = useRef<HTMLInputElement>(null);

  const [titulo, setTitulo] = useState("");
  const [fecha, setFecha] = useState(() => hoyEnCordoba());
  const [descripcion, setDescripcion] = useState("");
  const [actividades, setActividades] = useState<ActividadRuta[]>([]);
  const [nivelEsfuerzo, setNivelEsfuerzo] = useState<NivelEsfuerzo | null>(null);
  const [largo, setLargo] = useState("");
  const [subida, setSubida] = useState("");
  const [bajada, setBajada] = useState("");
  const [companeros, setCompaneros] = useState<string[]>([]);

  const [archivo, setArchivo] = useState<File | null>(null);
  const [delArchivo, setDelArchivo] = useState<NumerosDelArchivo | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [errorDelArchivo, setErrorDelArchivo] = useState<string | null>(null);

  const [guardando, setGuardando] = useState(false);
  const [errorAlGuardar, setErrorAlGuardar] = useState<string | null>(null);

  // Siempre cuatro, en el mismo orden: así lo piden los hooks.
  const fotos = [
    useFoto("salida", FORMAS_DE_RECORTE.salida),
    useFoto("salida", FORMAS_DE_RECORTE.salida),
    useFoto("salida", FORMAS_DE_RECORTE.salida),
    useFoto("salida", FORMAS_DE_RECORTE.salida),
  ];
  const fotosOcupadas = fotos.some((foto) =>
    ["abriendo", "recortando", "preparando"].includes(foto.estado),
  );
  // Se ve la caja siguiente recién cuando la anterior tiene foto.
  const cajasVisibles = Math.min(
    fotos.length,
    1 + fotos.findLastIndex((foto) => foto.archivo !== null) + 1,
  );

  const alternar = <T,>(lista: T[], valor: T) =>
    lista.includes(valor) ? lista.filter((cada) => cada !== valor) : [...lista, valor];

  const alElegirArchivo = async (elegido: File | null) => {
    setErrorDelArchivo(null);
    if (!elegido) return;

    setLeyendo(true);
    const lectura = await leerArchivoDeRuta(elegido);
    setLeyendo(false);

    if (!lectura.ok) {
      setErrorDelArchivo(lectura.error);
      return;
    }

    setArchivo(elegido);
    setDelArchivo({
      largoKm: lectura.recorrido.largoKm,
      desnivelPositivoM: lectura.recorrido.desnivelPositivoM,
      desnivelNegativoM: lectura.recorrido.desnivelNegativoM,
    });
  };

  const alQuitarArchivo = () => {
    setArchivo(null);
    setDelArchivo(null);
    setErrorDelArchivo(null);
  };

  const alGuardar = async () => {
    setErrorAlGuardar(null);
    setGuardando(true);

    const resultado = await guardarSalida(
      crearClienteEnElNavegador(),
      {
        titulo,
        fecha,
        descripcion,
        actividades,
        nivelEsfuerzo,
        largoKm: delArchivo ? delArchivo.largoKm : leerNumero(largo),
        desnivelPositivoM: delArchivo ? delArchivo.desnivelPositivoM : leerNumero(subida),
        desnivelNegativoM: delArchivo ? delArchivo.desnivelNegativoM : leerNumero(bajada),
        companeros,
      },
      fotos.map((foto) => foto.archivo).filter((archivoDeFoto): archivoDeFoto is File => archivoDeFoto !== null),
      archivo,
    );

    setGuardando(false);

    if (!resultado.ok) {
      setErrorAlGuardar(resultado.error);
      return;
    }

    if (resultado.datos.avisos.length > 0) {
      await avisar({
        titulo: "La salida se guardó, pero no entró todo",
        mensaje: resultado.datos.avisos.join("\n\n"),
      });
    }

    router.replace("/salidas");
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BotonVolver destinoSiNoHayVuelta="/salidas" etiqueta="Volver a las salidas" />
        <h1 className="text-xl font-semibold text-texto">Cargar una salida</h1>
      </div>

      <Tarjeta className="space-y-4">
        <Campo
          label="Título"
          id="titulo-de-la-salida"
          value={titulo}
          onChange={(evento) => setTitulo(evento.target.value)}
          placeholder="Los Gigantes con el grupo"
          maxLength={LARGO_MAXIMO_DEL_TITULO}
        />
        <Campo
          label="Día de la salida"
          id="fecha-de-la-salida"
          type="date"
          value={fecha}
          max={hoyEnCordoba()}
          onChange={(evento) => setFecha(evento.target.value)}
        />
        <AreaDeTexto
          label="Cómo estuvo"
          id="descripcion-de-la-salida"
          value={descripcion}
          onChange={(evento) => setDescripcion(evento.target.value)}
          placeholder="Por dónde fueron, cómo estaba el camino, qué conviene saber."
        />
      </Tarjeta>

      <Tarjeta className="space-y-4">
        <Opciones
          etiqueta="Qué hiciste"
          ayuda="Podés elegir más de una."
          opciones={OPCIONES_DE_ACTIVIDAD}
          elegidas={actividades}
          alElegir={(valor) => setActividades((actuales) => alternar(actuales, valor))}
          columnas={2}
          multiple
        />
        <Opciones
          etiqueta="Esfuerzo — cuánto cansó"
          opciones={OPCIONES_DE_ESFUERZO}
          elegidas={nivelEsfuerzo === null ? [] : [nivelEsfuerzo]}
          alElegir={(valor) => setNivelEsfuerzo((actual) => (actual === valor ? null : valor))}
          columnas={4}
        />
      </Tarjeta>

      <Tarjeta className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
          El recorrido
        </h2>

        <input
          ref={entradaDeArchivo}
          type="file"
          accept={FORMATOS_ACEPTADOS}
          className="sr-only"
          onChange={(evento) => {
            const elegido = evento.target.files?.[0] ?? null;
            evento.target.value = "";
            void alElegirArchivo(elegido);
          }}
        />

        {archivo ? (
          <div className="flex items-center gap-3 rounded-xl border border-borde-fuerte bg-fondo px-3 py-3">
            <p className="min-w-0 flex-1 truncate text-base font-medium text-texto">{archivo.name}</p>
            <Boton variante="secundario" disabled={guardando} onClick={alQuitarArchivo}>
              Quitar
            </Boton>
          </div>
        ) : (
          <Boton
            anchoCompleto
            variante="secundario"
            disabled={leyendo || guardando}
            onClick={() => entradaDeArchivo.current?.click()}
          >
            {leyendo ? "Leyendo el archivo…" : "Sumar el archivo GPS (.gpx o .kml)"}
          </Boton>
        )}

        {errorDelArchivo ? (
          <p role="alert" className="rounded-xl border border-rojo-borde bg-rojo-fondo px-3 py-3 text-sm leading-6 text-rojo-texto">
            {errorDelArchivo}
          </p>
        ) : null}

        {delArchivo ? (
          <p className="text-sm leading-6 text-texto-suave">
            Los números salen del archivo: {delArchivo.largoKm.toFixed(1).replace(".", ",")} km, +
            {delArchivo.desnivelPositivoM} m y −{delArchivo.desnivelNegativoM} m.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <Campo
              label="Km"
              id="largo-de-la-salida"
              inputMode="decimal"
              value={largo}
              onChange={(evento) => setLargo(evento.target.value)}
              placeholder="14,5"
            />
            <Campo
              label="Subiste (m)"
              id="subida-de-la-salida"
              inputMode="numeric"
              value={subida}
              onChange={(evento) => setSubida(evento.target.value)}
              placeholder="800"
            />
            <Campo
              label="Bajaste (m)"
              id="bajada-de-la-salida"
              inputMode="numeric"
              value={bajada}
              onChange={(evento) => setBajada(evento.target.value)}
              placeholder="800"
            />
          </div>
        )}
      </Tarjeta>

      <Tarjeta className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
          Fotos
        </h2>
        <p className="text-sm leading-6 text-texto-suave">
          Hasta cuatro. La primera es la portada.
        </p>
        {fotos.slice(0, cajasVisibles).map((foto, indice) => (
          <SelectorDeFoto
            key={indice}
            foto={foto}
            deshabilitado={guardando}
            etiqueta={ETIQUETAS_DE_FOTO[indice]}
          />
        ))}
      </Tarjeta>

      <Tarjeta className="space-y-3">
        {perfiles.length > 0 ? (
          <Opciones
            etiqueta="Con quién fuiste"
            ayuda="Elegí a los que tienen cuenta en TrackApp."
            opciones={perfiles.map((perfil) => ({
              valor: perfil.id,
              etiqueta: perfil.nombre?.trim() || "Sin nombre",
            }))}
            elegidas={companeros}
            alElegir={(valor) => setCompaneros((actuales) => alternar(actuales, valor))}
            columnas={2}
            multiple
          />
        ) : (
          <p className="text-base leading-6 text-texto-suave">
            Todavía no hay otros usuarios para sumar como compañeros.
          </p>
        )}
        {avisoDeListaIncompleta ? (
          <p role="alert" className="text-sm leading-6 text-ambar-texto">
            La lista de usuarios quedó incompleta: {avisoDeListaIncompleta}. Puede faltar alguien.
          </p>
        ) : null}
      </Tarjeta>

      {errorAlGuardar ? (
        <Tarjeta franja="rojo">
          <p role="alert" className="text-base leading-6 text-rojo-texto">
            {errorAlGuardar}
          </p>
        </Tarjeta>
      ) : null}

      {!haySenal ? (
        <Tarjeta franja="ambar">
          <p className="text-base leading-6 text-texto">
            Sin señal. Lo que escribiste queda acá; cuando vuelva la señal vas a poder guardar.
          </p>
        </Tarjeta>
      ) : null}

      <div className="pb-2">
        <Boton
          anchoCompleto
          disabled={guardando || leyendo || fotosOcupadas || !haySenal}
          onClick={() => void alGuardar()}
        >
          {guardando ? "Guardando… no cierres la pantalla" : "Guardar la salida"}
        </Boton>
      </div>
    </div>
  );
}
