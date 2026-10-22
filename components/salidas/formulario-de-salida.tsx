"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AreaDeTexto } from "@/components/ui/area-de-texto";
import { Boton } from "@/components/ui/boton";
import { BotonVolver } from "@/components/ui/boton-volver";
import { Campo } from "@/components/ui/campo";
import { useDialogos } from "@/components/ui/dialogos";
import { Opciones, type Opcion } from "@/components/ui/opciones";
import { ElegirActividades } from "@/components/rutas/elegir-actividades";
import { Tarjeta } from "@/components/ui/tarjeta";
import { SelectorDeFoto } from "@/components/fotos/selector-de-foto";
import { FORMAS_DE_RECORTE } from "@/components/fotos/recorte-de-foto";
import { useFoto } from "@/hooks/use-foto";
import { olvidarLasSalidas, useSalidasDeLaApertura } from "@/hooks/use-salidas-de-la-apertura";
import { useQuienSoy } from "@/components/armazon/quien-soy";
import { SalidaQueNoSeVe } from "@/components/salidas/ficha-de-salida";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { mostrarEsfuerzo } from "@/lib/rutas/actividades";
import { FORMATOS_ACEPTADOS, leerArchivoDeRuta } from "@/lib/rutas/archivo";
import {
  editarSalida,
  guardarSalida,
  type CambioDeArchivo,
  type FotoDeSalida,
} from "@/lib/salidas/guardar";
import { simplificarLinea, type PuntoDeLinea } from "@/lib/salidas/linea";
import {
  hoyEnCordoba,
  leerNumero,
  LARGO_MAXIMO_DEL_TITULO,
  MAXIMO_DE_FOTOS,
} from "@/lib/salidas/reglas";
import { GrillaDeFotos } from "@/components/fotos/grilla-de-fotos";
import { useVariasFotos } from "@/hooks/use-varias-fotos";
import { crearClienteEnElNavegador } from "@/lib/supabase/navegador";
import {
  NIVELES_ESFUERZO,
  type ActividadRuta,
  type NivelEsfuerzo,
  type PerfilBreve,
  type Salida,
} from "@/types/database";

/**
 * Cargar o editar una salida. **Solo con internet**, como todo el módulo.
 *
 * Si se sube el archivo GPS, el largo y los desniveles salen de ahí y no se
 * escriben: igual que en rutas, un número tipeado a mano se equivoca. Sin
 * archivo, se pueden escribir. Con archivo, los mismos casilleros quedan
 * llenos y trabados: no se cambian por otro dibujo.
 *
 * Borrar la salida está en el detalle, no acá.
 *
 * Si la señal se va mientras se completa, lo escrito queda en pantalla y el
 * botón de guardar se traba hasta que vuelva.
 */

type Props = {
  /** La salida a editar. Sin ella, se carga una nueva. */
  salida?: Salida;
  /** Los demás usuarios, para elegir con quién fuiste. */
  perfiles: PerfilBreve[];
  avisoDeListaIncompleta: string | null;
};

const OPCIONES_DE_ESFUERZO: Opcion<NivelEsfuerzo>[] = NIVELES_ESFUERZO.map((nivel) => ({
  valor: nivel,
  etiqueta: mostrarEsfuerzo(nivel),
}));

type Numeros = { largoKm: number | null; desnivelPositivoM: number | null; desnivelNegativoM: number | null };

function comoTexto(numero: number | null): string {
  return numero === null ? "" : String(numero).replace(".", ",");
}

export function FormularioDeSalida({ salida, perfiles, avisoDeListaIncompleta }: Props) {
  const router = useRouter();
  const haySenal = useHaySenal();
  const { avisar } = useDialogos();
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
  const [errorAlGuardar, setErrorAlGuardar] = useState<string | null>(null);

  // La portada se elige sola y se recorta a la forma con que se ve en la
  // lista. Las demás, hasta completar el tope, se eligen de a varias juntas.
  const portada = useFoto("portadaDeSalida", FORMAS_DE_RECORTE.portadaDeSalida);
  // La que ya tenía la salida, al editar. `null` cuando se quitó o no había.
  const [portadaGuardada, setPortadaGuardada] = useState<string | null>(salida?.fotos[0] ?? null);
  const demas = useVariasFotos("salida", MAXIMO_DE_FOTOS, salida?.fotos.slice(1) ?? []);

  const fotosOcupadas =
    ["abriendo", "recortando", "preparando"].includes(portada.estado) || demas.procesando !== null;
  const laPortada: FotoDeSalida | null =
    portada.archivo ?? (portada.estado === "vacio" ? portadaGuardada : null);
  const lasDemas: FotoDeSalida[] = demas.fotos.map((foto) =>
    foto.clase === "nueva" ? foto.archivo : foto.url,
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

  const esBorrador = salida?.estado === "borrador";

  const alGuardar = async (publicar = false) => {
    setErrorAlGuardar(null);

    // Sin portada, la foto que quedara primera no tendría la forma de la lista.
    if (laPortada === null && lasDemas.length > 0) {
      setErrorAlGuardar("Falta la portada. Elegila arriba de las demás fotos, o quitá las demás.");
      return;
    }

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
    const fotosFinales = laPortada ? [laPortada, ...lasDemas] : [];
    const supabase = crearClienteEnElNavegador();

    let resultado;
    if (salida) {
      const cambio: CambioDeArchivo = archivoNuevo
        ? { tipo: "nuevo", archivo: archivoNuevo, linea: lineaNueva }
        : salida.archivoUrl && !tieneArchivoGuardado
          ? { tipo: "quitar" }
          : { tipo: "mantener" };
      resultado = await editarSalida(supabase, salida.id, datos, fotosFinales, cambio, publicar);
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

    // Lo pedido en esta apertura ya no está al día: la próxima pantalla lo trae fresco.
    olvidarLasSalidas();
    if (editando) {
      // Volver vuelve a la pantalla de antes, y se rearma con lo nuevo.
      router.back();
    } else {
      router.replace("/salidas");
    }
  };

  const conArchivo = archivoNuevo !== null || tieneArchivoGuardado;
  const textoDeKm = delArchivo
    ? comoTexto(delArchivo.largoKm === null ? null : Math.round(delArchivo.largoKm * 10) / 10)
    : largo;
  const textoDeSubida = delArchivo ? comoTexto(delArchivo.desnivelPositivoM) : subida;
  const textoDeBajada = delArchivo ? comoTexto(delArchivo.desnivelNegativoM) : bajada;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BotonVolver destinoSiNoHayVuelta="/salidas" etiqueta="Volver" />
        <h1 className="min-w-0 flex-1 text-xl font-semibold text-texto">
          {esBorrador ? "Completar la salida" : editando ? "Editar la salida" : "Cargar una salida"}
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
        <ElegirActividades
          modo="varias"
          etiqueta="Qué hiciste"
          elegidas={actividades}
          alTocar={(valor) => setActividades((actuales) => alternar(actuales, valor))}
        />
        <Opciones
          etiqueta="Esfuerzo"
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
          <p className="text-base leading-6 text-texto-suave">
            Los números salen del archivo y no se escriben a mano.
          </p>
        ) : null}
        <div className="grid grid-cols-3 gap-3">
          <Campo
            label="Km"
            id="largo-de-la-salida"
            inputMode="decimal"
            value={textoDeKm}
            disabled={delArchivo !== null}
            className="disabled:text-texto"
            onChange={(evento) => setLargo(evento.target.value)}
            placeholder="14,5"
          />
          <Campo
            label="Subiste (m)"
            id="subida-de-la-salida"
            inputMode="numeric"
            value={textoDeSubida}
            disabled={delArchivo !== null}
            className="disabled:text-texto"
            onChange={(evento) => setSubida(evento.target.value)}
            placeholder="800"
          />
          <Campo
            label="Bajaste (m)"
            id="bajada-de-la-salida"
            inputMode="numeric"
            value={textoDeBajada}
            disabled={delArchivo !== null}
            className="disabled:text-texto"
            onChange={(evento) => setBajada(evento.target.value)}
            placeholder="800"
          />
        </div>
      </Tarjeta>

      <Tarjeta className="space-y-4">
        <SelectorDeFoto
          foto={portada}
          deshabilitado={guardando}
          fotoActual={portadaGuardada}
          alQuitarFotoActual={() => setPortadaGuardada(null)}
        />
        <GrillaDeFotos
          varias={demas}
          lugarLibre={MAXIMO_DE_FOTOS - 1 - demas.fotos.length}
          deshabilitado={guardando}
        />
      </Tarjeta>

      <Tarjeta className="space-y-3">
        {perfiles.length > 0 ? (
          <Opciones
            etiqueta="Con quién fuiste"
            ayuda="Elegí a los que tienen cuenta en TrackApp."
            opciones={perfiles.map((perfil) => ({
              valor: perfil.id,
              etiqueta: perfil.nombre,
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
        {esBorrador ? (
          <>
            <p className="text-sm leading-6 text-texto-suave">
              Es un borrador: solo lo ves vos. Al publicarlo lo ven todos.
            </p>
            <Boton
              anchoCompleto
              disabled={guardando || leyendo || fotosOcupadas || !haySenal}
              onClick={() => void alGuardar(true)}
            >
              {guardando ? "Guardando… no cierres la pantalla" : "Publicar la salida"}
            </Boton>
            <Boton
              anchoCompleto
              variante="secundario"
              disabled={guardando || leyendo || fotosOcupadas || !haySenal}
              onClick={() => void alGuardar(false)}
            >
              Guardar el borrador
            </Boton>
          </>
        ) : (
          <Boton
            anchoCompleto
            disabled={guardando || leyendo || fotosOcupadas || !haySenal}
            onClick={() => void alGuardar()}
          >
            {guardando
              ? "Guardando… no cierres la pantalla"
              : editando
                ? "Guardar los cambios"
                : "Guardar la salida"}
          </Boton>
        )}
      </div>
    </div>
  );
}

/**
 * Cargar o editar una salida con lo que ya llegó al celular: la salida y los
 * usuarios se pidieron una sola vez en esta apertura (decisión 054). Sin `id`
 * es una salida nueva.
 */
export function FormularioDeSalidaDeLaApertura({ id }: { id?: number }) {
  const { miPerfilId } = useQuienSoy();
  const haySenal = useHaySenal();
  const datos = useSalidasDeLaApertura();

  if (datos.estado === "cargando") {
    return haySenal ? (
      <p role="status" className="text-base text-texto-suave">Trayendo los datos…</p>
    ) : (
      <SalidaQueNoSeVe mensaje="Sin señal. Salidas funciona solo con internet: esperá a tener señal para cargar o editar." />
    );
  }
  if (datos.estado === "fallo") {
    return (
      <div className="space-y-3">
        <SalidaQueNoSeVe mensaje={`No se pudieron traer los datos: ${datos.motivo}. Tocá «Volver a intentar».`} />
        <Boton variante="secundario" onClick={datos.reintentar}>
          Volver a intentar
        </Boton>
      </div>
    );
  }

  const losDemas = datos.participantes.filter((perfil) => perfil.id !== miPerfilId);
  if (id === undefined) {
    return <FormularioDeSalida perfiles={losDemas} avisoDeListaIncompleta={datos.faltanParticipantes} />;
  }
  const salida = datos.salidas.find((cada) => cada.id === id);
  if (!salida) return <SalidaQueNoSeVe />;
  if (salida.perfil.id !== miPerfilId) {
    return <SalidaQueNoSeVe mensaje="Esta salida la cargó otra persona: solo ella la puede editar." />;
  }
  return (
    <FormularioDeSalida salida={salida} perfiles={losDemas} avisoDeListaIncompleta={datos.faltanParticipantes} />
  );
}
