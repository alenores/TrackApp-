import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getUserDisplayName } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell
      userName={getUserDisplayName(user)}
      userEmail={user.email ?? ""}
    >
      {children}
    </AppShell>
  );
}
