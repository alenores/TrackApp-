import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SinZoom } from "@/components/sin-zoom";
import { ProveedorDeDialogos } from "@/components/ui/dialogos";
import { PantallaDeArranque } from "@/components/armazon/pantalla-de-arranque";
import { ServiceWorkerRegister } from "./sw-register";
import { GUION_DE_ARRANQUE } from "@/lib/modo";
import {
  ID_DE_LA_PANTALLA_DE_ARRANQUE,
  DIBUJO_DE_LA_PANTALLA_DE_ARRANQUE,
  ESTILOS_DE_LA_PANTALLA_DE_ARRANQUE,
} from "@/lib/pwa/pantalla-de-arranque";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrackApp",
  description: "Rutas GPX, mapas y navegación offline.",
  applicationName: "TrackApp",
  appleWebApp: {
    capable: true,
    title: "TrackApp",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-hidden antialiased`}
    >
      <head>
        <meta name="application-name" content="TrackApp" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="TrackApp" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0f172a" />
        <style dangerouslySetInnerHTML={{ __html: ESTILOS_DE_LA_PANTALLA_DE_ARRANQUE }} />
        <meta name="trackapp-build" content={process.env.NEXT_PUBLIC_DEPLOY_SHA ?? "local"} />
        {/*
          Deja puesto el modo antes de que se dibuje nada. Sin esto la app
          aparece en un modo y salta al otro, que con sol de frente es un
          parpadeo blanco en la cara.
        */}
        <script dangerouslySetInnerHTML={{ __html: GUION_DE_ARRANQUE }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true){document.documentElement.classList.add("pwa-standalone");localStorage.setItem("pwa-installed-v1","1");localStorage.setItem("pwa-ever-standalone-v1","1");}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="fixed inset-0 flex min-h-0 flex-col overflow-hidden">
        <div
          id={ID_DE_LA_PANTALLA_DE_ARRANQUE}
          aria-hidden
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: DIBUJO_DE_LA_PANTALLA_DE_ARRANQUE }}
        />
        <SinZoom />
        <PantallaDeArranque />
        <ServiceWorkerRegister />
        {/*
          Los carteles de confirmar y avisar los dibuja la app, nunca el sistema
          operativo. Por eso esto envuelve TODA la app: si faltara en algún lado,
          esa pantalla se quedaría sin poder confirmar un borrado.
        */}
        <ProveedorDeDialogos>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {children}
          </div>
        </ProveedorDeDialogos>
      </body>
    </html>
  );
}
