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

/** El perfil de otro usuario: su portada, su avatar, su nombre y lo que practica. */
export function TarjetaDePerfil({ perfil, soyYo = false }: PropiedadesDeTarjetaDePerfil) {
  const nombre = perfil.nombre?.trim() || "Sin nombre";
  return (
    <div
      className={[
        "overflow-hidden rounded-2xl border bg-superficie text-left shadow-sm",
        soyYo ? "border-verde-borde" : "border-borde",
      ].join(" ")}
    >
      <PortadaDePerfil
        portadaUrl={perfil.portadaUrl}
        avatarUrl={perfil.avatarUrl}
        nombre={nombre}
        detalle={`${soyYo ? "Tu perfil · " : ""}${ETIQUETAS_DE_CATEGORIA[perfil.categoria]}`}
        actividades={perfil.actividades}
      />
    </div>
  );
}
