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
    <Tarjeta
      franja={soyYo ? "verde" : undefined}
      className="flex flex-col gap-4"
    >
      <div className="space-y-1">
        <p className="text-lg font-semibold text-texto">{nombre}</p>
        <p className="text-xs font-medium text-texto-suave">
          {soyYo ? "Tu perfil · " : ""}
          {ETIQUETAS_DE_CATEGORIA[perfil.categoria]}
        </p>
      </div>

      <div className="flex justify-center pt-1">
        <Avatar src={perfil.avatarUrl} name={nombre} size="lg" />
      </div>
    </Tarjeta>
  );
}
