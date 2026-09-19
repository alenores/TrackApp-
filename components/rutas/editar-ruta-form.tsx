"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { updateRuta } from "@/app/actions/update-ruta";
import { ACTIVIDADES } from "@/lib/rutas/actividades";
import type { ActividadTipo } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type EditarRutaFormProps = {
  rutaId: string;
  initialNombre: string;
  initialDescripcion: string;
  initialActividades: ActividadTipo[];
};

export function EditarRutaForm({
  rutaId,
  initialNombre,
  initialDescripcion,
  initialActividades,
}: EditarRutaFormProps) {
  const router = useRouter();
  const [nombre, setNombre] = useState(initialNombre);
  const [descripcion, setDescripcion] = useState(initialDescripcion);
  const [actividades, setActividades] = useState<ActividadTipo[]>(initialActividades);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleActividad = (tipo: ActividadTipo) => {
    setActividades((prev) =>
      prev.includes(tipo) ? prev.filter((a) => a !== tipo) : [...prev, tipo],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const result = await updateRuta({
      rutaId,
      nombre,
      descripcion: descripcion.trim() || null,
      actividades,
    });

    if (!result.success) {
      setError(result.error);
      setSaving(false);
      return;
    }

    router.push(`/rutas/${rutaId}`);
    router.refresh();
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <Card tono="alta" className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-texto">Editar ruta</h1>
            <p className="mt-1 text-sm text-texto-suave">
              Modificá el nombre, la descripción o las actividades.
            </p>
          </div>
          <Link
            href={`/rutas/${rutaId}`}
            className="shrink-0 text-sm text-acento-tenue hover:text-verde-texto"
          >
            Cancelar
          </Link>
        </div>

        <Input
          label="Nombre"
          required
          maxLength={120}
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          placeholder="Nombre de la ruta"
        />

        <div className="space-y-2">
          <label
            htmlFor="descripcion"
            className="block text-sm font-medium text-texto-suave"
          >
            Descripción (opcional)
          </label>
          <textarea
            id="descripcion"
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value)}
            rows={4}
            placeholder="Detalles del recorrido…"
            className="w-full rounded-xl border border-borde bg-superficie px-4 py-3 text-base text-texto placeholder:text-texto-suave focus:border-acento-borde focus:outline-none focus:ring-2 focus:ring-acento-borde"
          />
        </div>

        <div className="space-y-2">
          <p className="block text-sm font-medium text-texto-suave">
            Actividades (opcional)
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {ACTIVIDADES.map((act) => {
              const selected = actividades.includes(act.tipo);
              return (
                <button
                  key={act.tipo}
                  type="button"
                  onClick={() => toggleActividad(act.tipo)}
                  className={[
                    "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                    selected
                      ? "border-acento-borde bg-verde-fondo text-verde-texto"
                      : "border-borde bg-superficie text-texto-suave hover:border-acento-borde hover:text-texto",
                  ].join(" ")}
                >
                  <span className="text-base leading-none" aria-hidden>
                    {act.icon}
                  </span>
                  {act.label}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-rojo-borde bg-rojo-fondo px-3 py-2 text-sm text-rojo-texto"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" anchoCompleto disabled={saving}>
        {saving ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}
