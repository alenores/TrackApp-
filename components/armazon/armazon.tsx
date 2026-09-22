"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { borrarLoGuardadoEnElCelular } from "@/lib/offline/salir";
import { crearClienteEnElNavegador } from "@/lib/supabase/navegador";
import { SelloDeVersion } from "@/components/armazon/sello-de-version";
import { Encabezado } from "@/components/armazon/encabezado";
import { BarraInferior } from "@/components/armazon/barra-inferior";
import { BotonDeModo } from "@/components/ui/boton-de-modo";
import { Avatar } from "@/components/ui/avatar";
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
  const [loggingOut, setLoggingOut] = useState(false);
  const showNewRouteFab = pathname === "/rutas" || pathname === "/";

  /**
   * Las pantallas que dibujan un rectángulo sobre el mapa usan **todo el ancho
   * de la pantalla**.
   */
  const pantallaAncha =
    /^\/zonas\/(nueva|\d+(\/(editar|sectores\/(nueva|\d+\/(editar|anotaciones))))?)$/.test(
      pathname,
    );

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
            <div className="border-b border-borde px-4 py-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <Link href="/" className="block">
                  <p className="text-lg font-bold text-texto">TrackApp</p>
                </Link>
                <BotonDeModo className="h-9 w-9 shrink-0" />
              </div>
              <div className="flex items-center gap-3">
                <Avatar src={userAvatarUrl} name={userName} size="md" />
                <p className="min-w-0 truncate text-sm font-medium text-texto">
                  {userName}
                </p>
              </div>
            </div>
            <MenuLateral onLogout={logoutHandler} loggingOut={loggingOut} />
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Encabezado />

          <main className="app-scroll-pane min-h-0 flex-1 px-2 pb-[calc(env(safe-area-inset-bottom)+4.5rem)] pt-3 sm:px-4 sm:pt-4 lg:pb-[calc(env(safe-area-inset-bottom)+1rem)]">
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

        <BarraInferior />

        {showNewRouteFab ? <BotonDeSubirRuta /> : null}
      </div>
    </ProveedorDeBarraDeProgreso>
  );
}
