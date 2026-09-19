"use client";

import { useEffect, useState } from "react";
import { useDatosDeLaApp } from "@/app/hooks/useDatosDeLaApp";
import { RutaList } from "@/components/rutas/ruta-list";
import { RutaListSkeleton } from "@/components/rutas/ruta-list-skeleton";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { Perfil } from "@/types/database";

/**
 * La lista de rutas.
 *
 * Dibuja con lo que hay guardado en el celular y se pone al día sola. Cada
 * estado tiene su cartel: nunca queda una pantalla muda.
 */

type RutasClientProps = {
  miPerfilId: string | null;
};

async function traerPerfiles(ids: string[]): Promise<Record<string, Perfil>> {
  const unicos = [...new Set(ids.filter(Boolean))];
  if (unicos.length === 0) return {};

  const supabase = createClient();
  const { data, error } = await supabase
    .from("perfiles")
    .select("id, nombre, avatar_url, categoria, creado_en, actualizado_en")
    .in("id", unicos)
    .is("eliminado_en", null);

  if (error || !data) return {};

  const porId: Record<string, Perfil> = {};

  for (const fila of data as Array<{
    id: string;
    nombre: string | null;
    avatar_url: string | null;
    categoria: Perfil["categoria"];
    creado_en: string;
    actualizado_en: string;
  }>) {
    porId[fila.id] = {
      id: fila.id,
      nombre: fila.nombre,
      avatarUrl: fila.avatar_url,
      categoria: fila.categoria,
      creadoEn: fila.creado_en,
      actualizadoEn: fila.actualizado_en,
    };
  }

  return porId;
}

export function RutasClient({ miPerfilId }: RutasClientProps) {
  const { paquete, estado, aviso } = useDatosDeLaApp();
  const [perfiles, setPerfiles] = useState<Record<string, Perfil>>({});

  const rutas = paquete?.rutas ?? [];

  useEffect(() => {
    if (rutas.length === 0) return;
    void traerPerfiles(rutas.map((ruta) => ruta.perfilId)).then(setPerfiles);
  }, [rutas]);

  if (estado === "abriendo") {
    return <RutaListSkeleton showFabSpacer count={3} />;
  }

  if (estado === "sin_datos") {
    return (
      <Card accent className="space-y-2">
        <p className="text-base font-medium text-foreground">
          Todavía no hay nada guardado en este celular.
        </p>
        <p className="text-sm leading-6 text-slate-400">
          {aviso ??
            "Conectate a internet una vez y las rutas quedan guardadas para usarlas sin señal."}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {estado === "sin_senal" ? (
        <Card>
          <p className="text-sm font-medium text-slate-300">
            Sin señal. Estás viendo lo último que quedó guardado en el celular.
          </p>
        </Card>
      ) : null}

      {estado === "incompleto" && aviso ? (
        <Card accent>
          <p role="alert" className="text-sm leading-6 text-amber-200">
            No se pudo poner todo al día: {aviso} Lo que ves es lo último
            completo que había guardado.
          </p>
        </Card>
      ) : null}

      <RutaList
        rutas={rutas}
        miPerfilId={miPerfilId}
        perfiles={perfiles}
        showNewRouteFab
      />
    </div>
  );
}
