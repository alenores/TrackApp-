"use client";

import { useRouter } from "next/navigation";
import { useDatosDeLaApp } from "@/app/hooks/useDatosDeLaApp";
import { CargadorDeMapa } from "@/components/mapa/cargador-de-mapa";
import { SectorCard } from "@/components/zonas/sector-card";
import { BotonVolver } from "@/components/ui/boton-volver";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { calcularHuecoDeZona } from "@/lib/cobertura";
import { mostrarTamano } from "@/lib/territorio/tamano";

/**
 * Una zona con sus sectores.
 *
 * Lo que importa acá no es la lista: es **cuánto de la zona todavía no tiene
 * sector encima**. Ese hueco es lo que después deja una ruta sin mapa, y se
 * tiene que ver en casa, no en el cerro.
 */

type ZonaDetalleProps = {
  zonaId: number;
  miPerfilId: string | null;
};

export function ZonaDetalle({ zonaId, miPerfilId }: ZonaDetalleProps) {
  const router = useRouter();
  const { paquete, estado } = useDatosDeLaApp();

  const zona = paquete?.zonas.find((cada) => cada.id === zonaId) ?? null;
  const sectores = (paquete?.sectores ?? []).filter(
    (sector) => sector.zonaId === zonaId,
  );

  if (estado === "abriendo") {
    return (
      <Card className="py-8 text-center text-base text-texto-suave">
        Abriendo la zona…
      </Card>
    );
  }

  if (!zona) {
    return (
      <Card franja="rojo" className="space-y-3">
        <p role="alert" className="text-base leading-6 text-rojo-texto">
          Esta zona no está en el celular. Puede que la hayan borrado, o que
          todavía no se haya guardado acá.
        </p>
        <BotonVolver destinoSiNoHayVuelta="/zonas" etiqueta="Volver a las zonas" />
      </Card>
    );
  }

  const soyElAutor = miPerfilId !== null && miPerfilId === zona.perfilId;
  const hueco = calcularHuecoDeZona(zona.rectangulo, sectores);
  const porcentajeSinCubrir = Math.round(hueco.proporcionSinCubrir * 100);
  const todoCubierto = porcentajeSinCubrir === 0;

  return (
    <div className="space-y-3">
      {estado === "sin_senal" ? (
        <Card>
          <p className="text-sm font-medium text-texto-suave">
            Sin señal. Estás viendo lo último que quedó guardado en el celular.
          </p>
        </Card>
      ) : null}

      <Card className="space-y-3">
        <div className="flex items-start gap-2">
          <BotonVolver destinoSiNoHayVuelta="/zonas" etiqueta="Volver a las zonas" />
          <h1 className="min-w-0 flex-1 break-words pt-3 text-xl font-semibold text-texto">
            {zona.nombre}
          </h1>
        </div>

        {zona.descripcion ? (
          <p className="whitespace-pre-wrap break-words text-sm leading-6 text-texto-suave">
            {zona.descripcion}
          </p>
        ) : null}

        <div className="flex items-baseline justify-between gap-3 rounded-lg border border-borde-suave bg-fondo px-3 py-2">
          <span className="text-sm text-texto-suave">Le da a la zona</span>
          <span className="text-base font-semibold tabular-nums text-texto">
            {mostrarTamano(zona.rectangulo)}
          </span>
        </div>
      </Card>

      <Card className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
          Dónde queda
        </h2>
        <CargadorDeMapa
          rectangulo={zona.rectangulo}
          rectangulosExistentes={sectores.map((sector) => sector.rectangulo)}
        />
      </Card>

      <Card franja={todoCubierto ? "verde" : "ambar"} className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
          Cuánto está cubierto
        </h2>

        {todoCubierto ? (
          <p className="text-base font-semibold text-texto">
            Toda la zona tiene sector encima.
          </p>
        ) : (
          <>
            <p className="text-base font-semibold text-ambar-texto">
              Falta cubrir el {porcentajeSinCubrir}% de la zona
            </p>
            <p className="text-sm leading-6 text-texto-suave">
              Una ruta que pase por ahí va a quedar sin mapa. Creá los sectores
              que faltan antes de que haga falta.
            </p>
          </>
        )}

        <div className="flex items-center gap-3">
          <div className="flex h-2 flex-1 gap-0.5 overflow-hidden rounded-full">
            <div
              className="rounded-l-full bg-acento-hover"
              style={{ flexGrow: Math.max(100 - porcentajeSinCubrir, 1) }}
            />
            {porcentajeSinCubrir > 0 ? (
              <div
                className="rounded-r-full bg-superficie-alta"
                style={{ flexGrow: porcentajeSinCubrir }}
              />
            ) : null}
          </div>
          <span className="shrink-0 text-xs font-semibold tabular-nums text-texto-suave">
            {100 - porcentajeSinCubrir}%
          </span>
        </div>
      </Card>

      <div className="space-y-2">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-[0.08em] text-texto-suave">
          {sectores.length === 0
            ? "Sectores"
            : `Sectores (${sectores.length})`}
        </h2>

        {sectores.length === 0 ? (
          <Card>
            <p className="text-sm leading-6 text-texto-suave">
              Esta zona todavía no tiene sectores. El sector es el pedazo de mapa
              que se descarga de una vez: sin sectores no hay nada que bajar.
            </p>
          </Card>
        ) : (
          sectores.map((sector) => (
            <SectorCard
              key={sector.id}
              sector={sector}
              soyAdministrador={miPerfilId === sector.perfilId}
            />
          ))
        )}
      </div>

      <Button
        anchoCompleto
        paraNavegacion
        onClick={() => router.push(`/zonas/${zonaId}/sectores/nueva`)}
      >
        Crear un sector
      </Button>

      {soyElAutor ? (
        <div className="pb-2">
          <Button
            anchoCompleto
            variante="secundario"
            onClick={() => router.push(`/zonas/${zonaId}/editar`)}
          >
            Editar la zona
          </Button>
        </div>
      ) : null}
    </div>
  );
}
