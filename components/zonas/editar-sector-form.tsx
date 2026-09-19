"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { saveSector } from "@/app/actions/save-sector";
import { deleteSector } from "@/app/actions/delete-sector";
import type { SectorListItem } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type EditarSectorFormProps = {
  sector: SectorListItem;
  zonaNombre: string;
};

type CornerCoords = { lat: string; lon: string };

function parseCoord(v: string): number {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

export function EditarSectorForm({ sector, zonaNombre }: EditarSectorFormProps) {
  const router = useRouter();
  const [nombre, setNombre] = useState(sector.nombre);
  const [descripcion, setDescripcion] = useState(sector.descripcion ?? "");
  const [zoomMinimo, setZoomMinimo] = useState(String(sector.zoom_minimo));
  const [ne, setNe] = useState<CornerCoords>({
    lat: String(sector.lat_ne),
    lon: String(sector.lon_ne),
  });
  const [se, setSe] = useState<CornerCoords>({
    lat: String(sector.lat_se),
    lon: String(sector.lon_se),
  });
  const [so, setSo] = useState<CornerCoords>({
    lat: String(sector.lat_so),
    lon: String(sector.lon_so),
  });
  const [no, setNo] = useState<CornerCoords>({
    lat: String(sector.lat_no),
    lon: String(sector.lon_no),
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }

    const coords = [ne, se, so, no];
    const labels = ["NE", "SE", "SO", "NO"];
    for (let i = 0; i < coords.length; i++) {
      if (!coords[i].lat || !coords[i].lon) {
        setError(`Completá las coordenadas del extremo ${labels[i]}.`);
        return;
      }
    }

    const zoom = parseInt(zoomMinimo, 10);
    if (isNaN(zoom) || zoom < 10 || zoom > 18) {
      setError("El zoom mínimo debe estar entre 10 y 18.");
      return;
    }

    setSaving(true);
    // Delete old + create new
    await deleteSector(sector.id, sector.zona_id);
    const result = await saveSector({
      zonaId: sector.zona_id,
      nombre,
      descripcion: descripcion.trim() || null,
      lat_ne: parseCoord(ne.lat),
      lon_ne: parseCoord(ne.lon),
      lat_se: parseCoord(se.lat),
      lon_se: parseCoord(se.lon),
      lat_so: parseCoord(so.lat),
      lon_so: parseCoord(so.lon),
      lat_no: parseCoord(no.lat),
      lon_no: parseCoord(no.lon),
      zoom_minimo: zoom,
    });

    if (!result.success) {
      setError(result.error);
      setSaving(false);
      return;
    }

    router.push(`/zonas/${sector.zona_id}`);
  };

  const handleDelete = async () => {
    if (!confirm("¿Seguro que querés eliminar este sector?")) return;
    setDeleting(true);
    const result = await deleteSector(sector.id, sector.zona_id);
    if (!result.success) {
      alert(result.error);
      setDeleting(false);
      return;
    }
    router.push(`/zonas/${sector.zona_id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card tono="alta" className="space-y-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/zonas/${sector.zona_id}`}
            className="text-texto-suave hover:text-texto"
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
          <div>
            <p className="text-[11px] uppercase tracking-wider text-acento-tenue font-semibold">
              {zonaNombre}
            </p>
            <h1 className="text-xl font-bold text-texto">Editar sector</h1>
          </div>
        </div>

        <Input
          label="Nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-texto-suave">
            Descripción{" "}
            <span className="normal-case font-normal text-texto-suave">
              (opcional)
            </span>
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-borde bg-superficie px-4 py-3 text-sm text-texto placeholder-slate-500 focus:border-acento-borde focus:outline-none resize-none"
          />
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-texto-suave">
            Coordenadas de los extremos
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Noreste (NE)", state: ne, set: setNe },
              { label: "Noroeste (NO)", state: no, set: setNo },
              { label: "Sureste (SE)", state: se, set: setSe },
              { label: "Suroeste (SO)", state: so, set: setSo },
            ].map(({ label, state, set }) => (
              <div
                key={label}
                className="rounded-xl border border-borde bg-superficie/50 p-3 space-y-2"
              >
                <p className="text-[10px] font-bold uppercase tracking-wider text-acento-tenue">
                  {label}
                </p>
                <input
                  type="number"
                  step="any"
                  value={state.lat}
                  onChange={(e) => set((c) => ({ ...c, lat: e.target.value }))}
                  placeholder="Latitud"
                  className="w-full rounded-lg border border-borde bg-transparent px-3 py-2 text-xs text-texto placeholder-slate-600 focus:border-acento-borde focus:outline-none"
                />
                <input
                  type="number"
                  step="any"
                  value={state.lon}
                  onChange={(e) => set((c) => ({ ...c, lon: e.target.value }))}
                  placeholder="Longitud"
                  className="w-full rounded-lg border border-borde bg-transparent px-3 py-2 text-xs text-texto placeholder-slate-600 focus:border-acento-borde focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-texto-suave">
            Zoom mínimo recomendado
          </label>
          <input
            type="number"
            min={10}
            max={18}
            value={zoomMinimo}
            onChange={(e) => setZoomMinimo(e.target.value)}
            className="w-full rounded-xl border border-borde bg-superficie px-4 py-3 text-sm text-texto focus:border-acento-borde focus:outline-none"
          />
        </div>

        {error ? (
          <p className="rounded-xl bg-rojo-fondo px-4 py-3 text-sm text-rojo-texto">
            {error}
          </p>
        ) : null}

        <Button type="submit" anchoCompleto disabled={saving || deleting}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>

        <button
          type="button"
          disabled={deleting || saving}
          onClick={handleDelete}
          className="w-full rounded-xl border border-rojo-borde px-4 py-3 text-sm font-medium text-rojo hover:bg-rojo-fondo-fuerte"
        >
          {deleting ? "Eliminando…" : "Eliminar sector"}
        </button>
      </Card>
    </form>
  );
}
