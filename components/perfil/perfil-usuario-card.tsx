import { UserAvatar } from "@/components/ui/user-avatar";
import { Card } from "@/components/ui/card";
import type { DirectoryUser } from "@/lib/auth/directory";

type PerfilUsuarioCardProps = {
  user: DirectoryUser;
  isCurrentUser?: boolean;
};

export function PerfilUsuarioCard({
  user,
  isCurrentUser = false,
}: PerfilUsuarioCardProps) {
  return (
    <Card
      accent={isCurrentUser}
      className="flex flex-col gap-4"
    >
      <div className="space-y-1">
        <p className="text-lg font-semibold text-foreground">{user.nombre}</p>
        {isCurrentUser ? (
          <p className="text-xs font-medium text-emerald-300/90">Tu perfil</p>
        ) : null}
      </div>

      <div className="flex justify-center pt-1">
        <UserAvatar src={user.avatar_url} name={user.nombre} size="lg" />
      </div>
    </Card>
  );
}
