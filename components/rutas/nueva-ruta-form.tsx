"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { saveRuta } from "@/app/actions/save-ruta";
import {
  formatDistanceKm,
  parseGpxFile,
  type ParsedGpx,
} from "@/lib/gpx";
import { RouteMapLoader } from "@/components/map/route-map-loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function NuevaRutaForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [parsedGpx, setParsedGpx] = useState<ParsedGpx | null>(null);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);
    setParsedGpx(null);
    setGpxFile(null);

    if (!file) return;

    setParsing(true);
    try {
      const parsed = await parseGpxFile(file);
      setGpxFile(file);
      setParsedGpx(parsed);
    } catch (parseError) {
      setError(
        parseError instanceof Error
          ? parseError.message
          : "No se pudo procesar el archivo GPX o KML.",
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError("El nombre de la ruta es obligatorio.");
      return;
    }

    if (!gpxFile || !parsedGpx) {
      setError("Seleccioná un archivo GPX o KML válido.");
      return;
    }

    setSaving(true);

    const result = await saveRuta({
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      distanciaKm: parsedGpx.distanceKm,
      geojson: parsedGpx.geojson,
      bbox: parsedGpx.bbox,
      routeFile: gpxFile,
    });

    if (!result.success) {
      setError(result.error);
      setSaving(false);
      return;
    }

    router.push(`/rutas/${result.rutaId}`);
    router.refresh();
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <Card accent className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Nueva ruta</h1>
          <p className="mt-1 text-sm text-slate-400">
            Importá un archivo GPX para compartirlo con la comunidad.
          </p>
        </div>

        <Input
          label="Nombre"
          required
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          placeholder="Ej: Cerro Champaquí"
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
            rows={3}
            placeholder="Detalles del recorrido, dificultad, acceso…"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="gpx-file"
            className="block text-sm font-medium text-slate-300"
          >
            Archivo GPX o KML
          </label>
          <input
            ref={fileInputRef}
            id="gpx-file"
            type="file"
            accept=".gpx,.kml,application/gpx+xml,application/vnd.google-earth.kml+xml"
            onChange={(event) => void handleFileChange(event)}
            className="block w-full min-h-12 cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-900/50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-emerald-100"
          />
          {parsing ? (
            <p className="text-sm text-muted">Procesando archivo…</p>
          ) : null}
        </div>
      </Card>

      {parsedGpx ? (
        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Vista previa
            </h2>
            <p className="text-sm font-medium text-emerald-200">
              {formatDistanceKm(parsedGpx.distanceKm)}
            </p>
          </div>
          <RouteMapLoader geojson={parsedGpx.geojson} bbox={parsedGpx.bbox} />
        </Card>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-800/50 bg-red-950/40 px-3 py-2 text-sm text-red-300"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" fullWidth disabled={saving || parsing || !parsedGpx}>
        {saving ? "Guardando ruta…" : "Guardar ruta"}
      </Button>
    </form>
  );
}
