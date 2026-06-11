import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PreventViewportZoom } from "@/components/prevent-viewport-zoom";
import { PwaSplash } from "@/components/layout/pwa-splash";
import { ServiceWorkerRegister } from "./sw-register";
import {
  INLINE_SPLASH_ID,
  INLINE_SPLASH_MARKUP,
  INLINE_SPLASH_STYLES,
} from "@/lib/pwa/inline-splash";
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
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-hidden antialiased dark`}
    >
      <head>
        <meta name="application-name" content="TrackApp" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="TrackApp" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0f172a" />
        <style dangerouslySetInnerHTML={{ __html: INLINE_SPLASH_STYLES }} />
        <meta name="trackapp-build" content={process.env.NEXT_PUBLIC_DEPLOY_SHA ?? "local"} />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true){document.documentElement.classList.add("pwa-standalone");localStorage.setItem("pwa-installed-v1","1");localStorage.setItem("pwa-ever-standalone-v1","1");}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="fixed inset-0 flex min-h-0 flex-col overflow-hidden">
        <div
          id={INLINE_SPLASH_ID}
          aria-hidden
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: INLINE_SPLASH_MARKUP }}
        />
        <PreventViewportZoom />
        <PwaSplash />
        <ServiceWorkerRegister />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
      </body>
    </html>
  );
}
