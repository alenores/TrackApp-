import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getUserDisplayName } from "@/lib/auth/profile";
import { traerMiPerfil } from "@/lib/perfiles/datos";
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

  const userAvatarUrl = (await traerMiPerfil())?.avatarUrl ?? null;

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
