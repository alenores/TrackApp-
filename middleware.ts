import { type NextRequest } from "next/server";
import { refrescarSesion } from "@/lib/supabase/intermediario";

export async function middleware(request: NextRequest) {
  return refrescarSesion(request);
}

export const config = {
  matcher: [
    // La prueba de señal (`lib/conexion.ts`) no pasa por acá: tiene que
    // contestar al toque, sin mirar la sesión.
    "/((?!_next/static|_next/image|favicon.ico|api/senal|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
