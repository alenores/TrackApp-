"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

type AppShellProps = {
  userEmail: string;
  children: React.ReactNode;
};

export function AppShell({ userEmail, children }: AppShellProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-full min-h-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface/80 lg:block">
        <div className="sticky top-0 flex h-dvh flex-col">
          <div className="border-b border-border px-4 py-5">
            <Link href="/" className="block">
              <p className="text-lg font-bold text-foreground">TrackApp</p>
            </Link>
            <p className="mt-1 truncate text-xs text-muted">{userEmail}</p>
          </div>
          <Sidebar />
        </div>
      </aside>

      {/* Sidebar mobile overlay */}
      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-50 h-full w-[min(18rem,85vw)] border-r border-border bg-surface shadow-xl">
            <div className="flex h-full flex-col">
              <div className="border-b border-border px-4 py-4">
                <p className="text-lg font-bold text-foreground">TrackApp</p>
                <p className="mt-1 truncate text-xs text-muted">{userEmail}</p>
              </div>
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          userEmail={userEmail}
          onMenuToggle={() => setSidebarOpen(true)}
          onLogout={() => void handleLogout()}
          loggingOut={loggingOut}
        />
        <main className="app-scroll-pane min-h-0 flex-1 px-2 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-3 sm:px-4 sm:pt-4">
          <div className="mx-auto w-full max-w-3xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
