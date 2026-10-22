import { Avatar } from "@/components/ui/avatar";
import type { PerfilBreve } from "@/types/database";

/**
 * Quién creó el Circuito: su foto y su nombre, igual que en Salidas. Va en la
 * tarjeta de la lista y en el detalle. Sin señal, la foto deja su inicial.
 */
export function AutorDeCircuito({ autor }: { autor: PerfilBreve | null | undefined }) {
  if (!autor) return null;
  return (
    <div className="flex items-center gap-2">
      <Avatar src={autor.avatarUrl} name={autor.nombre} size="sm" />
      <span className="min-w-0 truncate text-sm text-texto-suave">
        Creado por <span className="font-medium text-texto">{autor.nombre}</span>
      </span>
    </div>
  );
}
