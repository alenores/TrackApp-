import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  esRutaDeEntrar,
  esRutaPublica,
  esRutaQueAndaSinSenal,
} from "@/lib/supabase/rutas-publicas";

export async function refrescarSesion(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // Usamos getSession() en lugar de getUser() para evitar llamadas externas
  // a Supabase en cada request. getUser() hace una request de red que puede
  // exceder el timeout de 1.5s del Edge Runtime de Vercel en mobile.
  // getSession() lee el JWT de la cookie (instantáneo, sin red).
  // La verificación del token server-side ocurre en los Server Components
  // y Server Actions, que tienen mayor tiempo de ejecución.
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const { pathname } = request.nextUrl;
  const isAuthRoute = esRutaDeEntrar(pathname);
  const isPublicRoute = esRutaPublica(pathname);
  const isOfflineFriendlyRoute = esRutaQueAndaSinSenal(pathname);

  // La galletita trackapp-tiene-paquete=1 la pone lib/offline/paquete.ts al guardar.
  const hasOfflineCache =
    request.cookies.get("trackapp-tiene-paquete")?.value === "1";

  if (!user && !isAuthRoute && !isPublicRoute) {
    if (isOfflineFriendlyRoute && hasOfflineCache) {
      // Dejar pasar: el cliente mostrará datos del caché local
      return supabaseResponse;
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthRoute) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

  if (user && !isPublicRoute) {
    supabaseResponse.headers.set(
      "Cache-Control",
      "private, no-cache, no-store, must-revalidate",
    );
  }

  return supabaseResponse;
}
