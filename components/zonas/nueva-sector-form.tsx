"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { saveSector } from "@/app/actions/save-sector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type NuevaSectorFormProps = {
  zonaId: string;
  zonaNombre: string;
};

type CornerCoords = {
  lat: string;
  lon: string;
};

function parseCoord(v: string): number {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

export function NuevaSectorForm({ zonaId, zonaNombre }: NuevaSectorFormProps) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [zoomMinimo, setZoomMinimo] = useState("12");
  const [ne, setNe] = useState<CornerCoords>({ lat: "", lon: "" });
  const [se, setSe] = useState<CornerCoords>({ lat: "", lon: "" });
  const [so, setSo] = useState<CornerCoords>({ lat: "", lon: "" });
  const [no, setNo] = useState<CornerCoords>({ lat: "", lon: "" });
  const [saving, setSaving] = useState(false);
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
    const result = await saveSector({
      zonaId,
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

    router.push(`/zonas/${zonaId}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card tono="alta" className="space-y-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/zonas/${zonaId}`}
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
            <h1 className="text-xl font-bold text-texto">Nuevo sector</h1>
          </div>
        </div>

        <Input
          label="Nombre"
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Pared Sur"
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
            placeholder="Describí el sector, tipo de roca, acceso…"
            className="w-full rounded-xl border border-borde bg-superficie px-4 py-3 text-sm text-texto placeholder-slate-500 focus:border-acento-borde focus:outline-none resize-none"
          />
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-texto-suave">
            Coordenadas de los extremos
          </p>
          <p className="text-xs text-texto-suave">
            Ingresá las coordenadas de las cuatro esquinas del sector (en
            decimal, ej: -31.4167).
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
          <p className="text-xs text-texto-suave">
            Nivel de zoom desde el cual se descarga el mapa. Mínimo 10. Para
            escala 1:5000 usá 15, para 1:25000 usá 12.
          </p>
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

        <Button type="submit" anchoCompleto disabled={saving}>
          {saving ? "Guardando…" : "Guardar sector"}
        </Button>
      </Card>
    </form>
  );
}
