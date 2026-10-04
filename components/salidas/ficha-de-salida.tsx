"use client";

import { useState } from "react";
import { BotonVolver } from "@/components/ui/boton-volver";
import { BotonRedondo } from "@/components/ui/boton-redondo";
import { useDialogos } from "@/components/ui/dialogos";
import { Emergente } from "@/components/ui/emergente";
import { Enlace } from "@/components/ui/enlace";
import { bajarElArchivo } from "@/lib/salidas/archivo";
import { Tarjeta } from "@/components/ui/tarjeta";
import { InsigniasDeActividad } from "@/components/rutas/insignias-de-actividad";
import { MapaDeLaSalida, MiniaturaDeLaLinea } from "@/components/salidas/mapa-de-la-salida";
import {
  BotonDeOpcionesDeSalida,
  NumerosDeSalida,
  PersonasDeSalida,
  PortadaDeSalida,
} from "@/components/salidas/partes-de-salida";
import { useHaySenal } from "@/hooks/use-hay-senal";
import type { Salida } from "@/types/database";

/**
 * La ficha de una salida: todo lo que tiene. La portada va limpia —solo el
 * título y el día— y los números van afuera, al lado de la miniatura del
 * recorrido, que tocándola abre el mapa. Después, la descripción completa,
 * todas las fotos —tocando una se ve en grande— y el archivo GPS para bajar.
 */

type Props = {
  salida: Salida;
  miPerfilId: string | null;
};

export function FichaDeSalida({ salida, miPerfilId }: Props) {
  const haySenal = useHaySenal();
  const [fotoAbierta, setFotoAbierta] = useState<string | null>(null);
  const [mapaAbierto, setMapaAbierto] = useState(false);
  const [bajando, setBajando] = useState(false);
  const { confirmar, avisar } = useDialogos();
  const puedeEditar = haySenal && salida.perfil.id === miPerfilId;

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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <BotonVolver destinoSiNoHayVuelta="/salidas" etiqueta="Volver a las salidas" />
        <div className="flex items-center gap-2">
          {salida.archivoUrl && haySenal ? (
            <BotonRedondo
              etiqueta="Bajar el archivo GPS"
              disabled={bajando}
              onClick={() => void alBajarElArchivo(salida.archivoUrl as string)}
            >
              <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" />
            </BotonRedondo>
          ) : null}
          {puedeEditar ? <BotonDeOpcionesDeSalida salidaId={salida.id} sobreFoto={false} /> : null}
        </div>
      </div>

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
        {tieneRecorrido || tieneNumeros ? (
          <div className="flex items-stretch gap-3">
            {tieneRecorrido ? (
              <MiniaturaDeLaLinea salida={salida} alTocar={() => setMapaAbierto(true)} />
            ) : null}
            <NumerosDeSalida salida={salida} />
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