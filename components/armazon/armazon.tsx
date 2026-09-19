"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { borrarLoGuardadoEnElCelular } from "@/lib/offline/salir";
import { crearClienteEnElNavegador } from "@/lib/supabase/navegador";
import { SelloDeVersion } from "@/components/armazon/sello-de-version";
import { Encabezado } from "@/components/armazon/encabezado";
import { ProveedorDeBarraDeProgreso } from "@/components/armazon/barra-de-progreso";
import { MenuLateral } from "@/components/armazon/menu-lateral";
import { BotonDeSubirRuta } from "@/components/rutas/boton-de-subir-ruta";
import { useDialogos } from "@/components/ui/dialogos";

type AppShellProps = {
  userName: string;
  userEmail: string;
  userAvatarUrl?: string | null;
  children: React.ReactNode;
};

export function Armazon({
  userName,
  userEmail,
  userAvatarUrl,
  children,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { confirmar } = useDialogos();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const showNewRouteFab = pathname === "/rutas" || pathname === "/";

  /**
   * Las pantallas que dibujan un rectángulo sobre el mapa usan **todo el ancho
   * de la pantalla**.
   *
   * En el celular no cambia nada. En la computadora, una columna angosta deja
   * el mapa del tamaño de una estampilla cuando lo que hace falta es
   * justamente mirarlo: sin ver los pueblos y los ríos alrededor no se puede
   * saber si el rectángulo cae donde uno quiere.
   */
  const pantallaAncha =
    /^\/zonas\/(nueva|\d+\/(editar|sectores\/(nueva|\d+\/editar)))$/.test(
      pathname,
    );

  /**
   * Cerrar sesión se confirma, y el cartel dice lo que de verdad pasa.
   *
   * **No es un botón más.** Al salir se borra del celular todo lo bajado: las
   * rutas, los sectores y los mapas. Volver a tenerlo necesita señal. Un toque
   * fantasma con la pantalla mojada, en el cerro, dejaría a la persona sin
   * mapa y sin forma de recuperarlo hasta volver.
   */
  const handleLogout = async () => {
    const seguro = await confirmar({
      titulo: "¿Cerrar sesión?",
      mensaje:
        "Se borra de este celular todo lo bajado: las rutas, los sectores y los mapas. Para volver a tenerlo vas a necesitar señal.",
      textoDeAceptar: "Cerrar sesión",
      destructivo: true,
    });

    if (!seguro) return;

    setLoggingOut(true);

    // Lo guardado en el celular se va con la cuenta: si no, el que entre
    // después ve las rutas del anterior, dibujadas desde el celular.
    await borrarLoGuardadoEnElCelular();

    const supabase = crearClienteEnElNavegador();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const logoutHandler = () => {
    void handleLogout();
  };

  return (
    <ProveedorDeBarraDeProgreso>
      <div className="flex h-full min-h-0 bg-fondo">
        <aside className="hidden w-64 shrink-0 border-r border-borde bg-superficie/80 lg:block">
          <div className="flex h-full min-h-0 flex-col">
            <div className="border-b border-borde px-4 py-5">
              <Link href="/" className="block">
                <p className="text-lg font-bold text-texto">TrackApp</p>
              </Link>
              <p className="mt-1 truncate text-sm font-medium text-texto">
                {userName}
              </p>
              <p className="truncate text-xs text-texto-suave">{userEmail}</p>
            </div>
            <MenuLateral onLogout={logoutHandler} loggingOut={loggingOut} />
          </div>
        </aside>

        {sidebarOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              aria-label="Cerrar menú"
              className="absolute inset-0 bg-velo"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="relative z-50 h-full w-[min(18rem,85vw)] border-r border-borde bg-superficie shadow-xl">
              <div className="flex h-full min-h-0 flex-col">
                <div className="border-b border-borde px-4 py-4">
                  <p className="text-lg font-bold text-texto">TrackApp</p>
                  <p className="mt-1 truncate text-sm font-medium text-texto">
                    {userName}
                  </p>
                  <p className="truncate text-xs text-texto-suave">
                    {userEmail}
                  </p>
                </div>
                <MenuLateral
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
          <Encabezado
            onMenuToggle={() => setSidebarOpen(true)}
            userName={userName}
            userAvatarUrl={userAvatarUrl}
          />
          <main className="app-scroll-pane min-h-0 flex-1 px-2 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 sm:px-4 sm:pt-4">
            <div
              className={[
                "mx-auto w-full",
                pantallaAncha ? "max-w-[1700px]" : "max-w-3xl",
              ].join(" ")}
            >
              {children}
              <SelloDeVersion />
            </div>
          </main>
        </div>

        {showNewRouteFab ? <BotonDeSubirRuta /> : null}
      </div>
    </ProveedorDeBarraDeProgreso>
  );
}
