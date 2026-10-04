import { PortadaDePerfil } from "@/components/perfil/portada-de-perfil";
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

/** El perfil de otro usuario: su portada con el avatar adentro, y su nombre. */
export function TarjetaDePerfil({ perfil, soyYo = false }: PropiedadesDeTarjetaDePerfil) {
  const nombre = perfil.nombre?.trim() || "Sin nombre";
  return (
    <div
      className={[
        "flex flex-col overflow-hidden rounded-2xl border bg-superficie text-left shadow-sm",
        soyYo ? "border-verde-borde" : "border-borde",
      ].join(" ")}
    >
      <PortadaDePerfil portadaUrl={perfil.portadaUrl} avatarUrl={perfil.avatarUrl} nombre={nombre} />
      <div className="space-y-1 px-4 pb-4 pt-3 sm:px-5">
        <p className="text-lg font-bold text-texto">{nombre}</p>
        <p className="text-sm font-medium text-texto-suave">
          {soyYo ? "Tu perfil · " : ""}
          {ETIQUETAS_DE_CATEGORIA[perfil.categoria]}
        </p>
      </div>
    </div>
  );
}
