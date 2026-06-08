"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { updateRuta } from "@/app/actions/update-ruta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type EditarRutaFormProps = {
  rutaId: string;
  initialNombre: string;
  initialDescripcion: string;
};

export function EditarRutaForm({
  rutaId,
  initialNombre,
  initialDescripcion,
}: EditarRutaFormProps) {
  const router = useRouter();
  const [nombre, setNombre] = useState(initialNombre);
  const [descripcion, setDescripcion] = useState(initialDescripcion);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const result = await updateRuta({
      rutaId,
      nombre,
      descripcion: descripcion.trim() || null,
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
      <Card tone="light" className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Editar ruta</h1>
            <p className="mt-1 text-sm text-slate-400">
              Modificá el nombre o la descripción del recorrido.
            </p>
          </div>
          <Link
            href={`/rutas/${rutaId}`}
            className="shrink-0 text-sm text-emerald-300 hover:text-emerald-200"
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
            className="block text-sm font-medium text-slate-300"
          >
            Descripción (opcional)
          </label>
          <textarea
            id="descripcion"
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value)}
            rows={4}
            placeholder="Detalles del recorrido…"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>
      </Card>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-800/50 bg-red-950/40 px-3 py-2 text-sm text-red-300"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" fullWidth disabled={saving}>
        {saving ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}
