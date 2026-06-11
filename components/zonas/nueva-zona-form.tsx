"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { saveZona } from "@/app/actions/save-zona";
import { PROVINCIAS_ARGENTINA } from "@/lib/zonas/helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function NuevaZonaForm() {
  const router = useRouter();
  const [provincia, setProvincia] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [saving, setSaving] = useState(false);
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

    router.push(`/zonas/${result.zonaId}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card tone="light" className="space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/zonas" className="text-slate-400 hover:text-foreground">
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
          <h1 className="text-xl font-bold text-foreground">Nueva zona</h1>
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
            placeholder="Describí la zona, cómo llegar, características generales…"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder-slate-500 focus:border-emerald-600 focus:outline-none resize-none"
          />
        </div>

        {error ? (
          <p className="rounded-xl bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        <Button type="submit" fullWidth disabled={saving}>
          {saving ? "Guardando…" : "Guardar zona"}
        </Button>
      </Card>
    </form>
  );
}
