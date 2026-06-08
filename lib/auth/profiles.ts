import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type ProfileRow = {
  id: string;
  avatar_url: string | null;
};

export const fetchCurrentUserAvatar = cache(
  async (userId: string): Promise<string | null> => {
    const map = await fetchAvatarUrlsByUserIds([userId]);
    return map[userId] ?? null;
  },
);

export async function fetchAvatarUrlsByUserIds(
  userIds: string[],
): Promise<Record<string, string | null>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return {};
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, avatar_url")
    .in("id", uniqueIds);

  if (error || !data) {
    return {};
  }

  const avatars: Record<string, string | null> = {};
  for (const row of data as ProfileRow[]) {
    avatars[row.id] = row.avatar_url?.trim() || null;
  }

  return avatars;
}
