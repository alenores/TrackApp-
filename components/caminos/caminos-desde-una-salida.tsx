"use client";

import { useEffect, useState } from "react";
import { EncabezadoDeMapas } from "@/components/mapas/pantalla-de-mapas";
import { BorradorDeLineas, ANCHO_DEL_PASILLO_M, km, type LineaDelBorrador } from "@/components/caminos/borrador-de-lineas";
import { Boton } from "@/components/ui/boton";
import { BuscadorDeTitulo } from "@/components/ui/buscador-de-titulo";
import { Tarjeta } from "@/components/ui/tarjeta";
import { TarjetaQueAbre } from "@/components/ui/tarjeta-que-abre";
import { useSalidasDeLaApertura } from "@/hooks/use-salidas-de-la-apertura";
import { diaEnPalabras } from "@/lib/fechas";
import { sinTildes } from "@/lib/marcas/buscar-en-consultas";
import { lineasDelRecorrido } from "@/lib/rutas/recorrido";
import { traerLaLineaUnaVez } from "@/lib/salidas/archivo";
import type { Salida } from "@/types/database";

/**
 * Caminos desde una salida (decisión 077): la línea del GPS de una salida, de
 * cualquier usuario, como **borrador**. Compara con Caminos existentes; el
 * usuario corta, corrige y crea de a un Camino. Ver `BorradorDeLineas`.
 */

export function CaminosDesdeUnaSalida({ alVolver }: { alVolver: () => void }) {
  const [salida, setSalida] = useState<Salida | null>(null);
  return salida
    ? <CargarBorradorDeLaSalida salida={salida} alVolver={() => setSalida(null)} />
    : <ElegirLaSalida alElegir={setSalida} alVolver={alVolver} />;
}

function ElegirLaSalida({ alElegir, alVolver }: { alElegir: (salida: Salida) => void; alVolver: () => void }) {
  const datos = useSalidasDeLaApertura();
  const [titulo, setTitulo] = useState("");
  const conArchivo = datos.estado === "listo" ? datos.salidas.filter((salida) => salida.archivoUrl) : [];
  const buscado = sinTildes(titulo);
  const encontradas = buscado ? conArchivo.filter((salida) => sinTildes(salida.titulo).includes(buscado)) : conArchivo;

  return (
    <div className="space-y-4">
      <EncabezadoDeMapas titulo="Marcas" subtitulo="Desde una salida" alVolver={alVolver} />
      <p className="text-base text-texto-suave">
        Elegí una salida con archivo GPS. Su línea se abre como borrador: vas a ver por dónde fue sobre Caminos
        que ya existen y decidir qué partes nuevas querés guardar como Caminos.
      </p>
      {datos.estado === "cargando" ? <p role="status" className="text-base text-texto">Trayendo las salidas…</p> : null}
      {datos.estado === "fallo" ? (
        <Tarjeta franja="rojo" className="space-y-3">
          <p role="alert" className="text-base text-texto">No se pudo traer la lista de salidas: {datos.motivo}</p>
          <Boton variante="secundario" onClick={datos.reintentar}>Volver a intentar</Boton>
        </Tarjeta>
      ) : null}
      {datos.estado === "listo" && conArchivo.length === 0 ? (
        <Tarjeta><p className="text-base text-texto-suave">Ninguna salida tiene archivo GPS todavía.</p></Tarjeta>
      ) : null}
      {conArchivo.length > 0 ? <BuscadorDeTitulo titulo={titulo} placeholder="Buscar salida" alCambiar={setTitulo} /> : null}
      {conArchivo.length > 0 && encontradas.length === 0 ? (
        <Tarjeta><p className="text-base text-texto-suave">Ninguna salida con archivo GPS se llama así.</p></Tarjeta>
      ) : null}
      <ul className="grid gap-3 sm:grid-cols-2">
        {encontradas.map((cada) => (
          <li key={cada.id}>
            <TarjetaQueAbre etiqueta={`Abrir el GPS de ${cada.titulo}`} alAbrir={() => alElegir(cada)} className="space-y-1">
              <p className="text-lg font-semibold text-texto">{cada.titulo}</p>
              <p className="text-base text-texto-suave">
                {diaEnPalabras(cada.fecha)} · {cada.perfil.nombre}{cada.largoKm !== null ? ` · ${km(cada.largoKm * 1000)}` : ""}
              </p>
            </TarjetaQueAbre>
          </li>
        ))}
      </ul>
    </div>
  );
}

type CargaDeLinea =
  | { estado: "cargando" }
  | { estado: "fallo"; motivo: string }
  | { estado: "listo"; lineas: LineaDelBorrador[] };

function CargarBorradorDeLaSalida({ salida, alVolver }: { salida: Salida; alVolver: () => void }) {
  const [carga, setCarga] = useState<CargaDeLinea>({ estado: "cargando" });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    void (async () => {
      try {
        const linea = await traerLaLineaUnaVez(salida.archivoUrl ?? "");
        if (!vigente) return;
        if (!linea.ok) {
          setCarga({ estado: "fallo", motivo: `No se pudo abrir el archivo GPS: ${linea.motivo}.` });
          return;
        }
        const original = lineasDelRecorrido(linea.geometria)
          .filter((cada) => cada.length >= 2)
          .map((coordenadas): LineaDelBorrador => ({ coordenadas, nombreSugerido: null }));
        if (original.length === 0) {
          setCarga({ estado: "fallo", motivo: "El archivo GPS de esta salida no trae ninguna línea." });
          return;
        }
        setCarga({ estado: "listo", lineas: original });
      } catch (causa) {
        if (vigente) {
          setCarga({
            estado: "fallo",
            motivo: `${causa instanceof Error ? causa.message : String(causa)}. Revisá la señal y volvé a intentar.`,
          });
        }
      }
    })();
    return () => { vigente = false; };
  }, [salida.archivoUrl, intento]);

  if (carga.estado === "cargando") {
    return (
      <div className="space-y-4">
        <EncabezadoDeMapas titulo="Marcas" subtitulo={salida.titulo} alVolver={alVolver} />
        <p role="status" className="text-base text-texto">Abriendo el GPS de la salida…</p>
      </div>
    );
  }

  if (carga.estado === "fallo") {
    return (
      <div className="space-y-4">
        <EncabezadoDeMapas titulo="Marcas" subtitulo={salida.titulo} alVolver={alVolver} />
        <Tarjeta franja="rojo" className="space-y-3">
          <p role="alert" className="text-base text-texto">{carga.motivo}</p>
          <Boton variante="secundario" onClick={() => { setCarga({ estado: "cargando" }); setIntento((cada) => cada + 1); }}>Volver a intentar</Boton>
        </Tarjeta>
      </div>
    );
  }

  return (
    <BorradorDeLineas
      subtitulo={salida.titulo}
      textoDeCarga="Comparando con los Caminos que ya existen…"
      textoDeAyuda={`La línea gruesa es el GPS, como borrador (va por encima). En verde, las partes que van sobre un Camino que ya existe (a menos de ${ANCHO_DEL_PASILLO_M} m); en el color de las salidas, las que no coinciden con ninguno. Los Caminos existentes se ven debajo, en una línea fina gris; los puntos y trazos también, de referencia. Podés cortar, unir al siguiente, descartar o crear un Camino. Al pasar el cursor por un tramo ves qué parte es; al tocarlo, la tarjeta sube sola en el panel. Es una propuesta: revisala.`}
      textoEmpezarDeNuevo="Si te perdiste entre cortes y correcciones, podés volver a empezar con la línea del GPS como vino."
      tituloEmpezarDeNuevo="¿Volver al GPS como vino?"
      mensajeEmpezarDeNuevo="Se pierden los cortes, las correcciones y el Camino que estás creando. Los Caminos ya guardados quedan."
      botonEmpezarDeNuevo="Volver al GPS original"
      lineas={carga.lineas}
      alVolver={alVolver}
      condicionInicial={null}
    />
  );
}
