import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
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
