"use client";

import { useMemo, useRef, useState } from "react";
import type { RutaListItem } from "@/types/database";
import { getUploaderLabel } from "@/lib/rutas/helpers";
import { RutaCard } from "@/components/rutas/ruta-card";
import { Card } from "@/components/ui/card";

type RutaListProps = {
  rutas: RutaListItem[];
  currentUserId: string | null;
  currentUserName: string | null;
  title?: string;
  showNewRouteFab?: boolean;
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m16.5 16.5 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function RutaList({
  rutas,
  currentUserId,
  currentUserName,
  title = "Rutas disponibles",
  showNewRouteFab = false,
}: RutaListProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredRutas = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return rutas;

    return rutas.filter((ruta) =>
      ruta.nombre.toLowerCase().includes(trimmed),
    );
  }, [query, rutas]);

  const toggleSearch = () => {
    setSearchOpen((current) => {
      const next = !current;
      if (next) {
        window.setTimeout(() => searchInputRef.current?.focus(), 0);
      } else {
        setQuery("");
      }
      return next;
    });
  };

  const summaryText =
    rutas.length === 0
      ? "Todavía no hay rutas cargadas."
      : query.trim()
        ? `${filteredRutas.length} de ${rutas.length} ruta${rutas.length === 1 ? "" : "s"}`
        : `${rutas.length} ruta${rutas.length === 1 ? "" : "s"} disponible${rutas.length === 1 ? "" : "s"}`;

  return (
    <div className={`space-y-4 ${showNewRouteFab ? "pb-16" : ""}`}>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted">{summaryText}</p>
          </div>

          {rutas.length > 0 ? (
            <button
              type="button"
              aria-label={searchOpen ? "Cerrar búsqueda" : "Buscar rutas"}
              aria-pressed={searchOpen}
              onClick={toggleSearch}
              className={[
                "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors",
                searchOpen
                  ? "border-emerald-700/50 bg-emerald-950/50 text-emerald-200"
                  : "border-border bg-surface text-muted hover:bg-surface-elevated hover:text-foreground",
              ].join(" ")}
            >
              <SearchIcon />
            </button>
          ) : null}
        </div>

        {searchOpen ? (
          <div className="space-y-2">
            <label htmlFor="buscar-rutas" className="sr-only">
              Buscar rutas por nombre
            </label>
            <input
              ref={searchInputRef}
              id="buscar-rutas"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre…"
              className="w-full min-h-12 rounded-xl border border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            />
          </div>
        ) : null}
      </div>

      {rutas.length === 0 ? (
        <Card>
          <p className="text-sm leading-6 text-slate-400">
            {showNewRouteFab
              ? "Sé el primero en subir una ruta GPX. Tocá el botón + abajo a la derecha."
              : "Sé el primero en subir una ruta GPX para compartirla con otros usuarios."}
          </p>
        </Card>
      ) : filteredRutas.length === 0 ? (
        <Card>
          <p className="text-sm leading-6 text-slate-400">
            No hay rutas que coincidan con &quot;{query.trim()}&quot;.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {filteredRutas.map((ruta) => (
            <li key={ruta.id}>
              <RutaCard
                ruta={ruta}
                isOwner={currentUserId === ruta.user_id}
                uploaderLabel={getUploaderLabel(
                  ruta,
                  currentUserId,
                  currentUserName,
                )}
              />
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}
