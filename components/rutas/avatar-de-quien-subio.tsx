import { Avatar } from "@/components/ui/avatar";

type UploaderAvatarProps = {
  avatarUrl?: string | null;
  uploaderLabel: string;
  size?: "sm" | "md" | "lg";
};

export function AvatarDeQuienSubio({
  avatarUrl,
  uploaderLabel,
  size = "md",
}: UploaderAvatarProps) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <Avatar src={avatarUrl} name={uploaderLabel} size={size} />
      <span className="sr-only">Foto de {uploaderLabel}</span>
    </div>
  );
}
