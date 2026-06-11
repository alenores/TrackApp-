"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BuildStamp } from "@/components/layout/build-stamp";
import { Header } from "@/components/layout/header";
import { NavigationProgressProvider } from "@/components/layout/navigation-progress";
import { Sidebar } from "@/components/layout/sidebar";
import { NuevaRutaFab } from "@/components/rutas/nueva-ruta-fab";

type AppShellProps = {
  userName: string;
  userEmail: string;
  userAvatarUrl?: string | null;
  children: React.ReactNode;
};

export function AppShell({
  userName,
  userEmail,
  userAvatarUrl,
  children,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const showNewRouteFab = pathname === "/rutas" || pathname === "/";

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const logoutHandler = () => {
    void handleLogout();
  };

  return (
    <NavigationProgressProvider>
    <div className="flex h-full min-h-0 bg-[#0f172a]">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface/80 lg:block">
        <div className="flex h-full min-h-0 flex-col">
          <div className="border-b border-border px-4 py-5">
            <Link href="/" className="block">
              <p className="text-lg font-bold text-foreground">TrackApp</p>
            </Link>
            <p className="mt-1 truncate text-sm font-medium text-foreground">
              {userName}
            </p>
            <p className="truncate text-xs text-muted">{userEmail}</p>
          </div>
          <Sidebar onLogout={logoutHandler} loggingOut={loggingOut} />
        </div>
      </aside>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-50 h-full w-[min(18rem,85vw)] border-r border-border bg-surface shadow-xl">
            <div className="flex h-full min-h-0 flex-col">
              <div className="border-b border-border px-4 py-4">
                <p className="text-lg font-bold text-foreground">TrackApp</p>
                <p className="mt-1 truncate text-sm font-medium text-foreground">
                  {userName}
                </p>
                <p className="truncate text-xs text-muted">{userEmail}</p>
              </div>
              <Sidebar
                onNavigate={() => setSidebarOpen(false)}
                onLogout={() => {
                  setSidebarOpen(false);
                  logoutHandler();
                }}
                loggingOut={loggingOut}
              />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          onMenuToggle={() => setSidebarOpen(true)}
          userName={userName}
          userAvatarUrl={userAvatarUrl}
        />
        <main className="app-scroll-pane min-h-0 flex-1 px-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 sm:px-4 sm:pt-4">
          <div className="mx-auto w-full max-w-3xl">
            {children}
            <BuildStamp />
          </div>
        </main>
      </div>

      {showNewRouteFab ? <NuevaRutaFab /> : null}
    </div>
    </NavigationProgressProvider>
  );
}
