"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { borrarSalida } from "@/app/actions/salidas";
import { BotonVolver } from "@/components/ui/boton-volver";
import { BotonRedondo, clasesDeBotonRedondo } from "@/components/ui/boton-redondo";
import { ICONO_DE_EDITAR, ICONO_DE_ELIMINAR } from "@/components/ui/iconos";
import { useDialogos } from "@/components/ui/dialogos";
import { Emergente } from "@/components/ui/emergente";
import { Enlace } from "@/components/ui/enlace";
import { diaEnPalabras } from "@/lib/fechas";
import { bajarElArchivo } from "@/lib/salidas/archivo";
import { Tarjeta } from "@/components/ui/tarjeta";
import { InsigniasDeActividad } from "@/components/rutas/insignias-de-actividad";
import { AlturasDeLaSalida, MapaDeLaSalida, MiniaturaDeLaLinea } from "@/components/salidas/mapa-de-la-salida";
import {
  NumerosDeSalida,
  PersonasDeSalida,
  PortadaDeSalida,
} from "@/components/salidas/partes-de-salida";
import { useHaySenal } from "@/hooks/use-hay-senal";
import type { Salida } from "@/types/database";

/**
 * La ficha de una salida: todo lo que tiene. El título va arriba, con volver
 * a la izquierda, como en el resto de las pantallas. La portada queda limpia
 * y el día va justo debajo. Los números van en la misma fila que la tarjeta
 * de la lista; abajo, la miniatura del recorrido, el doble de grande, y
 * debajo el gráfico de alturas si el archivo GPS las trae. El archivo para
 * bajar queda chico, sobre la miniatura. Abajo, editar y eliminar son dos
 * círculos, solo para quien la cargó y con señal.
 */

type Props = {
  salida: Salida;
  miPerfilId: string | null;
};

export function FichaDeSalida({ salida, miPerfilId }: Props) {
  const router = useRouter();
  const haySenal = useHaySenal();
  const [fotoAbierta, setFotoAbierta] = useState<string | null>(null);
  const [mapaAbierto, setMapaAbierto] = useState(false);
  const [bajando, setBajando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const { confirmar, avisar } = useDialogos();
  const puedeEditar = haySenal && salida.perfil.id === miPerfilId;

  const alEliminar = async () => {
    const seguro = await confirmar({
      titulo: "¿Borrar esta salida?",
      mensaje: "Dejará de verse en la app. Si te arrepentís, se puede recuperar.",
      textoDeAceptar: "Borrar la salida",
      destructivo: true,
    });
    if (!seguro) return;
    setEliminando(true);
    try {
      const resultado = await borrarSalida(salida.id);
      if (!resultado.ok) {
        setEliminando(false);
        await avisar({ titulo: "No se borró la salida", mensaje: resultado.error });
        return;
      }
      router.replace("/salidas");
      router.refresh();
    } catch (error) {
      setEliminando(false);
      await avisar({
        titulo: "No se borró la salida",
        mensaje: `${error instanceof Error ? error.message : String(error)}. Probá de nuevo con señal.`,
      });
    }
  };

  // Antes de bajar se dice qué es: un ícono solo no alcanza para saberlo.
  const alBajarElArchivo = async (direccion: string) => {
    const seguro = await confirmar({
      titulo: "¿Bajar el archivo GPS?",
      mensaje:
        "Es el recorrido de esta salida, para abrirlo en Google Earth, en tu reloj o en otra app de mapas. Se guarda en las descargas de tu celular o tu computadora.",
      textoDeAceptar: "Bajar el archivo",
    });
    if (!seguro) return;
    setBajando(true);
    const problema = await bajarElArchivo(direccion, salida.titulo);
    setBajando(false);
    if (problema) await avisar({ titulo: "No se bajó el archivo", mensaje: `${problema}.` });
  };
  const tieneRecorrido = salida.linea !== null || salida.archivoUrl !== null;
  const tieneNumeros =
    salida.largoKm !== null ||
    salida.desnivelPositivoM !== null ||
    salida.desnivelNegativoM !== null ||
    salida.nivelEsfuerzo !== null;

  const puedeBajar = salida.archivoUrl !== null && haySenal;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BotonVolver destinoSiNoHayVuelta="/salidas" etiqueta="Volver a las salidas" />
        <h1 className="min-w-0 flex-1 text-2xl font-bold leading-tight text-texto">{salida.titulo}</h1>
      </div>

      <div className="space-y-2">
        {salida.fotos.length > 0 ? (
          <button
            type="button"
            onClick={() => setFotoAbierta(salida.fotos[0])}
            aria-label="Ver la portada en grande"
            className="block w-full cursor-zoom-in text-left"
          >
            <PortadaDeSalida salida={salida} conDatos={false} />
          </button>
        ) : (
          <PortadaDeSalida salida={salida} conDatos={false} />
        )}
        <p className="text-base text-texto-suave">{diaEnPalabras(salida.fecha)}</p>
      </div>

      {salida.estado === "borrador" && puedeEditar ? (
        <Tarjeta franja="ambar" className="space-y-3">
          <p className="text-base leading-6 text-texto">
            Es un borrador: solo lo ves vos. Completá el título, con quién fuiste y lo que falte,
            y publicalo cuando quieras.
          </p>
          <Enlace href={`/salidas/${salida.id}/editar`} variante="principal">
            Completar y publicar
          </Enlace>
        </Tarjeta>
      ) : null}

      <Tarjeta className="space-y-4">
        <PersonasDeSalida salida={salida} />
        <InsigniasDeActividad actividades={salida.actividades} tamano="mediano" />
        {tieneNumeros ? <NumerosDeSalida salida={salida} /> : null}
        {tieneRecorrido ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <MiniaturaDeLaLinea
                salida={salida}
                alTocar={() => setMapaAbierto(true)}
                alBajar={puedeBajar ? () => void alBajarElArchivo(salida.archivoUrl as string) : undefined}
                bajando={bajando}
              />
            </div>
            <AlturasDeLaSalida salida={salida} />
          </div>
        ) : null}
        {salida.descripcion ? (
          <p className="whitespace-pre-line text-base leading-7 text-texto">{salida.descripcion}</p>
        ) : null}
      </Tarjeta>

      {salida.fotos.length > 1 ? (
        <div className="grid grid-cols-3 gap-2">
          {salida.fotos.slice(1).map((foto, indice) => (
            <button
              key={foto}
              type="button"
              onClick={() => setFotoAbierta(foto)}
              aria-label={`Ver la foto ${indice + 2} en grande`}
              className="cursor-zoom-in overflow-hidden rounded-xl border border-borde-suave"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={foto} alt="" loading="lazy" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {puedeEditar ? (
        <div className="flex items-center gap-2 pb-2">
          <Enlace href={`/salidas/${salida.id}/editar`} aria-label="Editar" title="Editar"
            className={clasesDeBotonRedondo("secundario")}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {ICONO_DE_EDITAR}
            </svg>
          </Enlace>
          <BotonRedondo etiqueta="Eliminar" variante="destructivo" disabled={eliminando} onClick={() => void alEliminar()}>
            {ICONO_DE_ELIMINAR}
          </BotonRedondo>
        </div>
      ) : null}

      <MapaDeLaSalida salida={salida} abierto={mapaAbierto} alCerrar={() => setMapaAbierto(false)} />

      <Emergente
        abierto={fotoAbierta !== null}
        alCerrar={() => setFotoAbierta(null)}
        titulo={salida.titulo}
        ancho="amplio"
      >
        {fotoAbierta ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={fotoAbierta} alt={`Foto de «${salida.titulo}»`} className="w-full rounded-xl" />
        ) : null}
      </Emergente>
    </div>
  );
}

/**
 * Cuando la salida no se puede mostrar. Sin `mensaje`, es que no existe o se
 * borró; con `mensaje`, qué pasó y qué hacer.
 */
export function SalidaQueNoSeVe({ mensaje = null }: { mensaje?: string | null }) {
  return (
    <div className="space-y-3">
      <BotonVolver destinoSiNoHayVuelta="/salidas" etiqueta="Volver a las salidas" />
      <Tarjeta franja={mensaje ? "rojo" : "ambar"}>
        <p role="alert" className="text-base leading-6 text-texto">
          {mensaje ??
            "Esta salida no existe o la borró quien la cargó. Volvé a la lista para ver las que hay."}
        </p>
      </Tarjeta>
    </div>
  );
}