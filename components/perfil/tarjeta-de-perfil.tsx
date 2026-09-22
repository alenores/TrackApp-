import { Avatar } from "@/components/ui/avatar";
import { Tarjeta } from "@/components/ui/tarjeta";
import type { Perfil } from "@/types/database";

type PropiedadesDeTarjetaDePerfil = {
  perfil: Perfil;
  soyYo?: boolean;
};

const ETIQUETAS_DE_CATEGORIA = {
  administrador: "Administrador",
  premium: "Premium",
  normal: "Normal",
} as const;

export function TarjetaDePerfil({
  perfil,
  soyYo = false,
}: PropiedadesDeTarjetaDePerfil) {
  const nombre = perfil.nombre?.trim() || "Sin nombre";
  return (
    <div
      className={[
        "relative flex flex-col overflow-hidden rounded-2xl border bg-superficie text-left transition-shadow shadow-sm",
        soyYo ? "border-verde-borde" : "border-borde",
      ].join(" ")}
    >
      {/* Portada */}
      <div className="relative h-24 w-full bg-superficie-alta sm:h-32">
        {perfil.portadaUrl ? (
          <img
            src={perfil.portadaUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
      </div>

      {/* Contenido (Avatar + Info) */}
      <div className="relative px-4 pb-5 sm:px-5">
        {/* Avatar solapado */}
        <div className="absolute -top-10 left-4 sm:left-5">
          <div className="rounded-full border-4 border-superficie">
            <Avatar src={perfil.avatarUrl} name={nombre} size="lg" />
          </div>
        </div>

        {/* Espacio para el avatar */}
        <div className="mt-12 space-y-1">
          <p className="text-lg font-bold text-texto">{nombre}</p>
          <p className="text-xs font-medium text-texto-suave">
            {soyYo ? "Tu perfil · " : ""}
            {ETIQUETAS_DE_CATEGORIA[perfil.categoria]}
          </p>
        </div>
      </div>
    </div>
  );
}
