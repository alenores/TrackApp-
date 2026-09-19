import { Avatar } from "@/components/ui/avatar";
import { Tarjeta } from "@/components/ui/tarjeta";
import type { DirectoryUser } from "@/lib/cuenta/directorio";

type PerfilUsuarioCardProps = {
  user: DirectoryUser;
  isCurrentUser?: boolean;
};

export function TarjetaDePerfil({
  user,
  isCurrentUser = false,
}: PerfilUsuarioCardProps) {
  return (
    <Tarjeta
      franja={isCurrentUser ? "verde" : undefined}
      className="flex flex-col gap-4"
    >
      <div className="space-y-1">
        <p className="text-lg font-semibold text-texto">{user.nombre}</p>
        {isCurrentUser ? (
          <p className="text-xs font-medium text-acento-tenue">Tu perfil</p>
        ) : null}
      </div>

      <div className="flex justify-center pt-1">
        <Avatar src={user.avatar_url} name={user.nombre} size="lg" />
      </div>
    </Tarjeta>
  );
}
