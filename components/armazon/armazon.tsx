"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { usePendientes } from "@/hooks/use-pendientes";
import { useSubirPendientes } from "@/hooks/use-subir-pendientes";
import { cuantosPendientesQuedan } from "@/lib/anotaciones/en-pantalla";
import { anotarMiPerfil } from "@/lib/cuenta/mi-perfil-en-el-celular";

type AppShellProps = {
  /** El id de quien usa la app. Se guarda en el celular para usarlo sin señal. */
  miPerfilId: string;
  soyAdministrador: boolean;
  userName: string;
  userEmail: string;
  userAvatarUrl?: string | null;
  children: React.ReactNode;
};

export function Armazon({
  miPerfilId,
  soyAdministrador,
  userName,
  userEmail,
  userAvatarUrl,
  children,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { confirmar } = useDialogos();
  const [loggingOut, setLoggingOut] = useState(false);
  const pendientes = usePendientes();
  const sinSubir = cuantosPendientesQuedan(pendientes);

  // Quién sos, guardado para la navegación, que no le pregunta a la base.
  useEffect(() => {
    anotarMiPerfil(miPerfilId, soyAdministrador);
  }, [miPerfilId, soyAdministrador]);

  // Lo marcado sin señal sube solo apenas hay señal y no estás navegando.
  useSubirPendientes(miPerfilId);
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
        sinSubir > 0
          ? `Se borra de este celular todo lo bajado, y también ${sinSubir === 1 ? "una anotación que marcaste sin señal y todavía no se subió" : `${sinSubir} anotaciones que marcaste sin señal y todavía no se subieron`}: esas se pierden. Si podés, esperá a que se suban.`
          : "Se borra de este celular todo lo bajado: las rutas, los sectores y los mapas. Para volver a tenerlo vas a necesitar señal.",
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
            <div className="relative overflow-hidden border-b border-borde px-4 py-4">
              <img
                src="/sierras-encabezado.jpg"
                alt=""
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-slate-950/40" />

              <div className="relative z-10 flex items-center justify-between gap-2">
                <Link href="/" className="flex items-center gap-2.5 min-w-0">
                  <img
                    src="/logo-identidad.png"
                    alt="TrackApp"
                    className="h-8 w-8 rounded-lg object-contain shrink-0 shadow-sm"
                  />
                  <span className="truncate text-lg font-extrabold tracking-wide text-white drop-shadow-md uppercase">
                    TrackApp
                  </span>
                </Link>
                <BotonDeModo className="h-8 w-8 shrink-0 border-white/20 bg-black/40 text-white shadow-sm" />
              </div>
            </div>
            <MenuLateral
              userName={userName}
              userAvatarUrl={userAvatarUrl}
              onLogout={logoutHandler}
              loggingOut={loggingOut}
            />
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
