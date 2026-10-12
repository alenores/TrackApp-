"use client";

import { useRouter } from "next/navigation";
import { MenuDeAcciones } from "@/components/ui/menu-de-acciones";
import { useDialogos } from "@/components/ui/dialogos";
import { TarjetaQueAbre } from "@/components/ui/tarjeta-que-abre";
import { borrarZona } from "@/app/actions/territorio";
import { ponerAlDiaDespuesDeGuardar } from "@/lib/offline/puesta-al-dia";
import type { Zona } from "@/types/database";

export function TarjetaDeZona({ zona, soyAdministrador, cantidadDeSectores }: {
  zona: Zona;
  soyAdministrador: boolean;
  cantidadDeSectores?: number;
}) {
  const router = useRouter();
  const { confirmar, avisar } = useDialogos();
  const eliminar = async () => {
    const seguro = await confirmar({ titulo: `¿Borrar «${zona.nombre}»?`,
      mensaje: cantidadDeSectores ? `Se borrarán también sus ${cantidadDeSectores} sectores y sus anotaciones. Si te arrepentís, se puede recuperar.`
        : "La zona dejará de verse en la app. Si te arrepentís, se puede recuperar.",
      textoDeAceptar: "Borrar", destructivo: true });
    if (!seguro) return;
    try {
      const resultado = await borrarZona(zona.id);
      if (!resultado.ok) { await avisar({ titulo: "No se pudo borrar", mensaje: resultado.error }); return; }
      await ponerAlDiaDespuesDeGuardar();
      router.refresh();
    } catch (error) {
      await avisar({ titulo: "No se pudo borrar",
        mensaje: `${error instanceof Error ? error.message : String(error)}. Probá de nuevo con señal.` });
    }
  };
  return <div className="relative">
    <TarjetaQueAbre etiqueta={`Abrir ${zona.nombre}`} alAbrir={() => router.push(`/zonas/${zona.id}`)}
      className="overflow-hidden" sobreFoto={Boolean(zona.fotoUrl)}>
      {zona.fotoUrl ? <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={zona.fotoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-sobre-foto-degrade/70" />
      </> : null}
      <div className={`relative space-y-2 ${soyAdministrador ? "pr-12" : ""}`}>
        <h2 className={`truncate text-lg font-bold ${zona.fotoUrl ? "text-sobre-foto-texto" : "text-texto"}`}>{zona.nombre}</h2>
        {zona.descripcion ? <p className={`line-clamp-2 text-base ${zona.fotoUrl ? "text-sobre-foto-texto-suave" : "text-texto-suave"}`}>{zona.descripcion}</p> : null}
        {cantidadDeSectores !== undefined ? <p className={`text-sm ${zona.fotoUrl ? "text-sobre-foto-texto-suave" : "text-texto-suave"}`}>
          {cantidadDeSectores === 0 ? "Todavía no tiene sectores" : cantidadDeSectores === 1 ? "1 sector" : `${cantidadDeSectores} sectores`}
        </p> : null}
      </div>
    </TarjetaQueAbre>
    {soyAdministrador ? <MenuDeAcciones className="absolute right-3 top-3 z-10"
      etiqueta={`Opciones de ${zona.nombre}`} sobreFoto={Boolean(zona.fotoUrl)}
      acciones={[
        { etiqueta: "Editar", alElegir: () => router.push(`/zonas/${zona.id}/editar`) },
        { etiqueta: "Eliminar", destructiva: true, alElegir: () => void eliminar() },
      ]} /> : null}
  </div>;
}
