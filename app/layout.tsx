import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PreventViewportZoom } from "@/components/prevent-viewport-zoom";
import { ServiceWorkerRegister } from "./sw-register";
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
  description: "TrackApp — base del proyecto lista para desarrollar.",
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
  themeColor: "#1b4332",
};

const buildVersion =
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local-dev";
const SHOW_BUILD_VERSION_BADGE = false;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        <meta name="application-name" content="TrackApp" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="TrackApp" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1b4332" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true){localStorage.setItem("pwa-installed-v1","1");localStorage.setItem("pwa-ever-standalone-v1","1");}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <PreventViewportZoom />
        <ServiceWorkerRegister />
        {children}
        {SHOW_BUILD_VERSION_BADGE ? (
          <div className="pointer-events-none fixed bottom-3 left-3 z-50 rounded-md bg-black/70 px-2 py-1 text-[10px] font-mono text-white">
            version: {buildVersion}
          </div>
        ) : null}
      </body>
    </html>
  );
}
