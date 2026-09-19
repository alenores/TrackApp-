"use client";

import { useEffect, useMemo, useState } from "react";
import { useDatosDeLaApp } from "@/app/hooks/useDatosDeLaApp";
import { RutaList } from "@/components/rutas/ruta-list";
import { RutaListSkeleton } from "@/components/rutas/ruta-list-skeleton";
import { Card } from "@/components/ui/card";
import { traerPerfilesPorId } from "@/lib/perfiles/cliente";
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

export function RutasClient({ miPerfilId }: RutasClientProps) {
  const { paquete, estado, aviso } = useDatosDeLaApp();
  const [perfiles, setPerfiles] = useState<Record<string, Perfil>>({});

  const rutas = useMemo(() => paquete?.rutas ?? [], [paquete]);

  useEffect(() => {
    if (rutas.length === 0) return;
    void traerPerfilesPorId(rutas.map((ruta) => ruta.perfilId)).then(setPerfiles);
  }, [rutas]);

  if (estado === "abriendo") {
    return <RutaListSkeleton showFabSpacer count={3} />;
  }

  if (estado === "sin_datos") {
    return (
      <Card franja="ambar" className="space-y-2">
        <p className="text-base font-medium text-texto">
          Todavía no hay nada guardado en este celular.
        </p>
        <p className="text-sm leading-6 text-texto-suave">
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
          <p className="text-sm font-medium text-texto-suave">
            Sin señal. Estás viendo lo último que quedó guardado en el celular.
          </p>
        </Card>
      ) : null}

      {estado === "incompleto" && aviso ? (
        <Card franja="ambar">
          <p role="alert" className="text-sm leading-6 text-ambar-texto">
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
