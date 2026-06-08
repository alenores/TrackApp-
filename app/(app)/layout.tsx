import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ensureCurrentUserProfile } from "@/lib/auth/ensure-profile";
import { getUserDisplayName } from "@/lib/auth/profile";
import { fetchCurrentUserAvatar } from "@/lib/auth/profiles";
import { getAuthUser } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  await ensureCurrentUserProfile(user);

  const userAvatarUrl = await fetchCurrentUserAvatar(user.id);

  return (
    <AppShell
      userName={getUserDisplayName(user)}
      userEmail={user.email ?? ""}
      userAvatarUrl={userAvatarUrl}
    >
      {children}
    </AppShell>
  );
}
