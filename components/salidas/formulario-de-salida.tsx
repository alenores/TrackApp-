"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { borrarSalida } from "@/app/actions/salidas";
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
import {
  editarSalida,
  guardarSalida,
  type CambioDeArchivo,
  type FotoDeSalida,
} from "@/lib/salidas/guardar";
import { simplificarLinea, type PuntoDeLinea } from "@/lib/salidas/linea";
import { hoyEnCordoba, leerNumero, LARGO_MAXIMO_DEL_TITULO } from "@/lib/salidas/reglas";
import { crearClienteEnElNavegador } from "@/lib/supabase/navegador";
import {
  ACTIVIDADES_RUTA,
  NIVELES_ESFUERZO,
  type ActividadRuta,
  type NivelEsfuerzo,
  type Perfil,
  type Salida,
} from "@/types/database";

/**
 * Cargar o editar una salida. **Solo con internet**, como todo el módulo.
 *
 * Si se sube el archivo GPS, el largo y los desniveles salen de ahí y no se
 * escriben: igual que en rutas, un número tipeado a mano se equivoca. Sin
 * archivo, se pueden escribir.
 *
 * Borrar la salida está acá, al editar, y pide confirmación. Nunca está a un
 * toque desde la lista.
 *
 * Si la señal se va mientras se completa, lo escrito queda en pantalla y los
 * botones de guardar y borrar se traban hasta que vuelva.
 */

type Props = {
  /** La salida a editar. Sin ella, se carga una nueva. */
  salida?: Salida;
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

type Numeros = { largoKm: number | null; desnivelPositivoM: number | null; desnivelNegativoM: number | null };

function comoTexto(numero: number | null): string {
  return numero === null ? "" : String(numero).replace(".", ",");
}

export function FormularioDeSalida({ salida, perfiles, avisoDeListaIncompleta }: Props) {
  const router = useRouter();
  const haySenal = useHaySenal();
  const { avisar, confirmar } = useDialogos();
  const entradaDeArchivo = useRef<HTMLInputElement>(null);
  const editando = salida !== undefined;

  const [titulo, setTitulo] = useState(salida?.titulo ?? "");
  const [fecha, setFecha] = useState(() => salida?.fecha ?? hoyEnCordoba());
  const [descripcion, setDescripcion] = useState(salida?.descripcion ?? "");
  const [actividades, setActividades] = useState<ActividadRuta[]>(salida?.actividades ?? []);
  const [nivelEsfuerzo, setNivelEsfuerzo] = useState<NivelEsfuerzo | null>(salida?.nivelEsfuerzo ?? null);
  const [companeros, setCompaneros] = useState<string[]>(
    salida?.companeros.map((companero) => companero.id) ?? [],
  );

  // Con archivo, los números son los del archivo; sin archivo, los escritos.
  const [archivoNuevo, setArchivoNuevo] = useState<File | null>(null);
  const [lineaNueva, setLineaNueva] = useState<PuntoDeLinea[]>([]);
  const [tieneArchivoGuardado, setTieneArchivoGuardado] = useState(Boolean(salida?.archivoUrl));
  const [delArchivo, setDelArchivo] = useState<Numeros | null>(
    salida?.archivoUrl
      ? {
          largoKm: salida.largoKm,
          desnivelPositivoM: salida.desnivelPositivoM,
          desnivelNegativoM: salida.desnivelNegativoM,
        }
      : null,
  );
  const [largo, setLargo] = useState(salida?.archivoUrl ? "" : comoTexto(salida?.largoKm ?? null));
  const [subida, setSubida] = useState(salida?.archivoUrl ? "" : comoTexto(salida?.desnivelPositivoM ?? null));
  const [bajada, setBajada] = useState(salida?.archivoUrl ? "" : comoTexto(salida?.desnivelNegativoM ?? null));
  const [leyendo, setLeyendo] = useState(false);
  const [errorDelArchivo, setErrorDelArchivo] = useState<string | null>(null);

  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [errorAlGuardar, setErrorAlGuardar] = useState<string | null>(null);
  const ocupado = guardando || borrando;

  // Siempre cuatro, en el mismo orden: así lo piden los hooks.
  const fotos = [
    useFoto("salida", FORMAS_DE_RECORTE.salida),
    useFoto("salida", FORMAS_DE_RECORTE.salida),
    useFoto("salida", FORMAS_DE_RECORTE.salida),
    useFoto("salida", FORMAS_DE_RECORTE.salida),
  ];
  // Las que ya tenía la salida, al editar. `null` cuando se quitó o no había.
  const [fotosGuardadas, setFotosGuardadas] = useState<(string | null)[]>(() =>
    fotos.map((_, indice) => salida?.fotos[indice] ?? null),
  );

  const fotosOcupadas = fotos.some((foto) =>
    ["abriendo", "recortando", "preparando"].includes(foto.estado),
  );
  const queHayEnCadaCaja: (FotoDeSalida | null)[] = fotos.map(
    (foto, indice) => foto.archivo ?? (foto.estado === "vacio" ? fotosGuardadas[indice] : null),
  );
  // Se ve la caja siguiente recién cuando la anterior tiene foto.
  const cajasVisibles = Math.min(
    fotos.length,
    queHayEnCadaCaja.findLastIndex((cosa) => cosa !== null) + 2,
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

    setArchivoNuevo(elegido);
    setLineaNueva(simplificarLinea(lectura.recorrido.geometria));
    setDelArchivo({
      largoKm: lectura.recorrido.largoKm,
      desnivelPositivoM: lectura.recorrido.desnivelPositivoM,
      desnivelNegativoM: lectura.recorrido.desnivelNegativoM,
    });
  };

  const alQuitarArchivo = () => {
    setArchivoNuevo(null);
    setLineaNueva([]);
    setTieneArchivoGuardado(false);
    setDelArchivo(null);
    setErrorDelArchivo(null);
  };

  const alGuardar = async () => {
    setErrorAlGuardar(null);
    setGuardando(true);

    const datos = {
      titulo,
      fecha,
      descripcion,
      actividades,
      nivelEsfuerzo,
      largoKm: delArchivo ? delArchivo.largoKm : leerNumero(largo),
      desnivelPositivoM: delArchivo ? delArchivo.desnivelPositivoM : leerNumero(subida),
      desnivelNegativoM: delArchivo ? delArchivo.desnivelNegativoM : leerNumero(bajada),
      companeros,
    };
    const fotosFinales = queHayEnCadaCaja.filter((cosa): cosa is FotoDeSalida => cosa !== null);
    const supabase = crearClienteEnElNavegador();

    let resultado;
    if (salida) {
      const cambio: CambioDeArchivo = archivoNuevo
        ? { tipo: "nuevo", archivo: archivoNuevo, linea: lineaNueva }
        : salida.archivoUrl && !tieneArchivoGuardado
          ? { tipo: "quitar" }
          : { tipo: "mantener" };
      resultado = await editarSalida(supabase, salida.id, datos, fotosFinales, cambio);
    } else {
      resultado = await guardarSalida(
        supabase,
        datos,
        fotosFinales,
        archivoNuevo ? { archivo: archivoNuevo, linea: lineaNueva } : null,
      );
    }

    setGuardando(false);

    if (!resultado.ok) {
      setErrorAlGuardar(resultado.error);
      return;
    }

    if (resultado.datos.avisos.length > 0) {
      await avisar({
        titulo: editando
          ? "Los cambios se guardaron, pero no entró todo"
          : "La salida se guardó, pero no entró todo",
        mensaje: resultado.datos.avisos.join("\n\n"),
      });
    }

    if (editando) {
      // Volver vuelve a la pantalla de antes, y se rearma con lo nuevo.
      router.back();
      router.refresh();
    } else {
      router.replace("/salidas");
      router.refresh();
    }
  };

  const alBorrar = async () => {
    if (!salida) return;
    const seguro = await confirmar({
      titulo: "¿Borrar esta salida?",
      mensaje: `«${salida.titulo}» deja de verse en la lista, para vos y para los demás.`,
      textoDeAceptar: "Borrar la salida",
      destructivo: true,
    });
    if (!seguro) return;

    setBorrando(true);
    const respuesta = await borrarSalida(salida.id);
    setBorrando(false);

    if (!respuesta.ok) {
      await avisar({ titulo: "No se borró la salida", mensaje: respuesta.error });
      return;
    }
    router.replace("/salidas");
    router.refresh();
  };

  const conArchivo = archivoNuevo !== null || tieneArchivoGuardado;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BotonVolver destinoSiNoHayVuelta="/salidas" etiqueta="Volver" />
        <h1 className="text-xl font-semibold text-texto">
          {editando ? "Editar la salida" : "Cargar una salida"}
        </h1>
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

        {conArchivo ? (
          <div className="flex items-center gap-3 rounded-xl border border-borde-fuerte bg-fondo px-3 py-3">
            <p className="min-w-0 flex-1 truncate text-base font-medium text-texto">
              {archivoNuevo ? archivoNuevo.name : "El archivo GPS que ya estaba"}
            </p>
            <Boton variante="secundario" disabled={ocupado} onClick={alQuitarArchivo}>
              Quitar
            </Boton>
          </div>
        ) : (
          <Boton
            anchoCompleto
            variante="secundario"
            disabled={leyendo || ocupado}
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
            Los números salen del archivo y no se escriben a mano:{" "}
            {[
              delArchivo.largoKm !== null ? `${comoTexto(Math.round(delArchivo.largoKm * 10) / 10)} km` : null,
              delArchivo.desnivelPositivoM !== null ? `+${delArchivo.desnivelPositivoM} m` : null,
              delArchivo.desnivelNegativoM !== null ? `−${delArchivo.desnivelNegativoM} m` : null,
            ]
              .filter(Boolean)
              .join(", ") || "el archivo no trae números"}
            .
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
            deshabilitado={ocupado}
            etiqueta={ETIQUETAS_DE_FOTO[indice]}
            fotoActual={fotosGuardadas[indice]}
            alQuitarFotoActual={() =>
              setFotosGuardadas((actuales) =>
                actuales.map((guardada, cual) => (cual === indice ? null : guardada)),
              )
            }
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

      <div className="space-y-3 pb-2">
        <Boton
          anchoCompleto
          disabled={ocupado || leyendo || fotosOcupadas || !haySenal}
          onClick={() => void alGuardar()}
        >
          {guardando
            ? "Guardando… no cierres la pantalla"
            : editando
              ? "Guardar los cambios"
              : "Guardar la salida"}
        </Boton>
        {editando ? (
          <Boton
            anchoCompleto
            variante="destructivo"
            disabled={ocupado || !haySenal}
            onClick={() => void alBorrar()}
          >
            {borrando ? "Borrando…" : "Borrar la salida"}
          </Boton>
        ) : null}
      </div>
    </div>
  );
}
