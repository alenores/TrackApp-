"use client";

import { useEffect, useState } from "react";
import { Boton } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { Avatar } from "@/components/ui/avatar";
import { useHaySenal } from "@/hooks/use-hay-senal";
import { FormularioDeSalida } from "@/components/salidas/formulario-de-salida";
import { traerSalidas } from "@/app/actions/salidas";
import { InsigniasDeActividad } from "@/components/rutas/insignias-de-actividad";

export function PantallaDeSalidas({ miPerfilId }: { miPerfilId?: string }) {
  const haySenal = useHaySenal();
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  
  // Estado simple para leer en vivo (sin caché offline)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [salidas, setSalidas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarSalidas = async () => {
    setCargando(true);
    const data = await traerSalidas();
    setSalidas(data);
    setCargando(false);
  };

  useEffect(() => {
    if (haySenal && !mostrandoFormulario) {
      // eslint-disable-next-line
      cargarSalidas();
    }
  }, [haySenal, mostrandoFormulario]);

  if (!haySenal) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto w-full p-4 relative z-10">
        <h1 className="text-2xl font-bold uppercase text-texto">Salidas</h1>
        <Tarjeta franja="ambar" className="space-y-2">
          <p className="text-base font-medium text-texto">Sin conexión</p>
          <p className="text-base leading-6 text-texto-suave">
            El módulo de salidas funciona únicamente online. Conectate a internet para ver o +s.
          </p>
        </Tarjeta>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto w-full p-4 relative z-10 pb-[100px]">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold uppercase text-texto">Salidas</h1>
        {!mostrandoFormulario ? (
          <Boton variante="principal" onClick={() => setMostrandoFormulario(true)}>
            +
          </Boton>
        ) : null}
      </div>

      {mostrandoFormulario ? (
        <Tarjeta>
          <FormularioDeSalida 
            alCancelar={() => setMostrandoFormulario(false)}
            alTerminar={() => setMostrandoFormulario(false)}
          />
        </Tarjeta>
      ) : cargando ? (
        <Tarjeta className="py-8 text-center text-base text-texto-suave">
          Cargando salidas…
        </Tarjeta>
      ) : salidas.length === 0 ? (
        <Tarjeta className="py-8 text-center text-base text-texto-suave">
          Todavía no hay salidas registradas. ¡Sé el primero!
        </Tarjeta>
      ) : (
        <div className="space-y-6">
          {salidas.map((s) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const fotoPortada = s.fotos?.find((f: any) => f.orden === 0)?.foto_url || s.fotos?.[0]?.foto_url;
            return (
              <Tarjeta key={s.id} className="overflow-hidden p-0 border-borde-suave">
                {/* Portada en la parte superior */}
                {fotoPortada ? (
                  <div className="relative h-56 w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={fotoPortada} 
                      alt={s.titulo} 
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-fondo/95 via-fondo/40 to-transparent" />
                    
                    <div className="absolute bottom-4 left-4 right-4">
                      <h2 className="text-xl font-bold leading-tight text-texto drop-shadow-md">
                        {s.titulo || "Salida"}
                      </h2>
                      <p className="mt-1 text-xs font-medium uppercase tracking-wider text-texto/80 drop-shadow-sm">
                        {new Date(s.creado_en).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 pb-0">
                    <h2 className="text-xl font-bold text-texto">{s.titulo || "Salida"}</h2>
                    <p className="text-xs font-medium uppercase tracking-wider text-texto-suave">
                      {new Date(s.creado_en).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                )}

                <div className="p-4 space-y-4">
                  {/* Autor y Amigos (Avatares) */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 pr-3 border-r border-borde">
                      <Avatar src={s.autor?.avatar_url} name={s.autor?.nombre || "Usuario"} size="sm" />
                      <span className="text-sm font-semibold text-texto">{s.autor?.nombre}</span>
                    </div>
                    
                    {s.etiquetas?.length > 0 ? (
                      <div className="flex -space-x-2">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {s.etiquetas.map((e: any) => (
                          <div key={e.perfil.id} className="rounded-full ring-2 ring-superficie">
                            <Avatar src={e.perfil.avatar_url} name={e.perfil.nombre || "U"} size="sm" />
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {/* Descripción */}
                  {s.descripcion ? (
                    <p className="text-sm leading-relaxed text-texto-suave whitespace-pre-wrap">
                      {s.descripcion}
                    </p>
                  ) : null}

                  {/* Insignias y Datos numéricos */}
                  <div className="space-y-3 pt-2 border-t border-borde-suave">
                    {s.actividades && s.actividades.length > 0 ? (
                      <InsigniasDeActividad actividades={s.actividades} tamano="mediano" />
                    ) : null}
                    
                    <div className="flex flex-wrap gap-2">
                      {s.kilometros ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-superficie px-2 py-1 text-xs font-semibold text-texto border border-borde-suave">
                          {s.kilometros.toFixed(1).replace(".", ",")} km
                        </span>
                      ) : null}
                      {s.metros_subidos ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-verde-fondo px-2 py-1 text-xs font-semibold text-verde-texto border border-verde-borde/20">
                          +{s.metros_subidos} m
                        </span>
                      ) : null}
                      {s.metros_bajados ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-superficie px-2 py-1 text-xs font-semibold text-texto border border-borde-suave">
                          −{s.metros_bajados} m
                        </span>
                      ) : null}
                      {s.dificultad ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-superficie px-2 py-1 text-xs font-semibold uppercase tracking-wider text-texto-suave border border-borde-suave">
                          {s.dificultad}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Tarjeta>
            );
          })}
        </div>
      )}
    </div>
  );
}
