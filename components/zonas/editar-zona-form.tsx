"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { saveZona } from "@/app/actions/save-zona";
import { deleteZona } from "@/app/actions/delete-zona";
import { PROVINCIAS_ARGENTINA } from "@/lib/zonas/helpers";
import type { ZonaListItem } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type EditarZonaFormProps = {
  zona: ZonaListItem;
};

export function EditarZonaForm({ zona }: EditarZonaFormProps) {
  const router = useRouter();
  const [provincia, setProvincia] = useState(zona.provincia);
  const [nombre, setNombre] = useState(zona.nombre);
  const [descripcion, setDescripcion] = useState(zona.descripcion ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!provincia) {
      setError("Seleccioná una provincia.");
      return;
    }
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    setSaving(true);
    const result = await saveZona({
      provincia,
      nombre,
      descripcion: descripcion.trim() || null,
    });

    if (!result.success) {
      setError(result.error);
      setSaving(false);
      return;
    }

    // Eliminar la zona original y redirigir a la nueva
    await deleteZona(zona.id);
    router.push(`/zonas/${result.zonaId}`);
  };

  const handleDelete = async () => {
    if (!confirm("¿Seguro que querés eliminar esta zona y todos sus sectores?"))
      return;
    setDeleting(true);
    const result = await deleteZona(zona.id);
    if (!result.success) {
      alert(result.error);
      setDeleting(false);
      return;
    }
    router.push("/zonas");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card tone="light" className="space-y-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/zonas/${zona.id}`}
            className="text-slate-400 hover:text-foreground"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-6 w-6"
              aria-hidden
            >
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-foreground">Editar zona</h1>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Provincia
          </label>
          <select
            value={provincia}
            onChange={(e) => setProvincia(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-emerald-600 focus:outline-none"
            required
          >
            <option value="">Seleccioná una provincia…</option>
            {PROVINCIAS_ARGENTINA.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Nombre
          </label>
          <Input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Sierra Chica Norte"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Descripción{" "}
            <span className="normal-case font-normal text-slate-500">
              (opcional)
            </span>
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder-slate-500 focus:border-emerald-600 focus:outline-none resize-none"
          />
        </div>

        {error ? (
          <p className="rounded-xl bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        <Button type="submit" fullWidth disabled={saving || deleting}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>

        <button
          type="button"
          disabled={deleting || saving}
          onClick={handleDelete}
          className="w-full rounded-xl border border-red-900/40 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-950/40"
        >
          {deleting ? "Eliminando…" : "Eliminar zona"}
        </button>
      </Card>
    </form>
  );
}
