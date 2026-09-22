"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Perfil, RutaResumen } from "@/types/database";
import { TarjetaDeRuta } from "@/components/rutas/tarjeta-de-ruta";
import { Tarjeta } from "@/components/ui/tarjeta";

type RutaListProps = {
  rutas: RutaResumen[];
  miPerfilId: string | null;
  perfiles: Record<string, Perfil>;
  title?: string;
  showNewRouteFab?: boolean;
  /** Cuando la lista quedó corta, se dice. Nunca se muestra incompleta callado. */
  avisoDeListaIncompleta?: string | null;
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

export function ListaDeRutas({
  rutas,
  miPerfilId,
  perfiles,
  title = "RUTAS",
  showNewRouteFab = false,
  avisoDeListaIncompleta = null,
}: RutaListProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchInputWrapRef = useRef<HTMLDivElement>(null);
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const searchHistoryPushedRef = useRef(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const closeSearch = useCallback((fromPopState = false) => {
    setSearchOpen(false);
    setQuery("");

    if (fromPopState) {
      searchHistoryPushedRef.current = false;
      return;
    }

    if (searchHistoryPushedRef.current) {
      searchHistoryPushedRef.current = false;
      window.history.back();
    }
  }, []);

  const openSearch = useCallback(() => {
    setSearchOpen(true);

    if (!searchHistoryPushedRef.current) {
      window.history.pushState({ rutaSearch: true }, "", window.location.href);
      searchHistoryPushedRef.current = true;
    }

    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  }, []);

  const filteredRutas = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return rutas;

    return rutas.filter((ruta) =>
      ruta.nombre.toLowerCase().includes(trimmed),
    );
  }, [query, rutas]);

  const toggleSearch = () => {
    if (searchOpen) {
      closeSearch();
      return;
    }

    openSearch();
  };

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (searchToggleRef.current?.contains(target)) {
        return;
      }

      if (searchInputWrapRef.current?.contains(target)) {
        return;
      }

      closeSearch();
    };

    const handlePopState = () => {
      closeSearch(true);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [searchOpen, closeSearch]);

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
            <h1 className="text-2xl font-bold uppercase text-texto">{title}</h1>
            <p className="text-sm text-texto-suave">{summaryText}</p>
          </div>

          {rutas.length > 0 ? (
            <button
              ref={searchToggleRef}
              type="button"
              aria-label={searchOpen ? "Cerrar búsqueda" : "Buscar rutas"}
              aria-pressed={searchOpen}
              onClick={toggleSearch}
              className={[
                "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
                searchOpen
                  ? "border-acento-borde bg-verde-fondo text-verde-texto"
                  : "border-borde bg-superficie text-texto-suave hover:bg-superficie-alta hover:text-texto",
              ].join(" ")}
            >
              <SearchIcon />
            </button>
          ) : null}
        </div>

        {searchOpen ? (
          <div ref={searchInputWrapRef} className="space-y-2">
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
              className="w-full min-h-12 rounded-xl border border-borde bg-superficie px-4 py-3 text-base text-texto placeholder:text-texto-suave/50 focus:border-acento-borde focus:outline-none focus:ring-2 focus:ring-acento-borde"
            />
          </div>
        ) : null}
      </div>

      {avisoDeListaIncompleta ? (
        <Tarjeta franja="ambar">
          <p role="alert" className="text-sm leading-6 text-ambar-texto">
            La lista de rutas quedó incompleta: {avisoDeListaIncompleta}. Lo que
            ves acá abajo puede no ser todo. Recargá la pantalla para intentar de
            nuevo.
          </p>
        </Tarjeta>
      ) : null}

      {rutas.length === 0 ? (
        <Tarjeta>
          <p className="text-sm leading-6 text-texto-suave">
            {showNewRouteFab
              ? "Todavía no hay rutas. Subí la primera con el botón de abajo a la derecha."
              : "Todavía no hay rutas cargadas."}
          </p>
        </Tarjeta>
      ) : filteredRutas.length === 0 ? (
        <Tarjeta>
          <p className="text-sm leading-6 text-texto-suave">
            No hay rutas que coincidan con &quot;{query.trim()}&quot;.
          </p>
        </Tarjeta>
      ) : (
        <ul className="space-y-3">
          {filteredRutas.map((ruta) => (
            <li key={ruta.id}>
              <TarjetaDeRuta
                ruta={ruta}
                soyElAutor={miPerfilId === ruta.perfilId}
                autor={
                  miPerfilId === ruta.perfilId
                    ? "Vos"
                    : (perfiles[ruta.perfilId]?.nombre ?? "Alguien")
                }
                avatarDelAutor={perfiles[ruta.perfilId]?.avatarUrl ?? null}
              />
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}
