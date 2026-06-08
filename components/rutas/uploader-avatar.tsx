import { UserAvatar } from "@/components/ui/user-avatar";

type UploaderAvatarProps = {
  avatarUrl?: string | null;
  uploaderLabel: string;
  size?: "sm" | "md" | "lg";
};

export function UploaderAvatar({
  avatarUrl,
  uploaderLabel,
  size = "md",
}: UploaderAvatarProps) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <UserAvatar src={avatarUrl} name={uploaderLabel} size={size} />
      <span className="sr-only">Foto de {uploaderLabel}</span>
    </div>
  );
}
