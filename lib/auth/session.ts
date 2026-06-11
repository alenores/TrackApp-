import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// getUser() verifica el token contra el servidor de Supabase. En mobile con
// red inestable puede fallar y tirar un 500, haciendo que el browser muestre
// "can't load this". Caemos a getSession() (cookie local, sin red) como
// fallback para que los Server Components nunca rompan la navegación.
export const getAuthUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();

  try {
    const { data } = await supabase.auth.getUser();
    return data.user;
  } catch {
    const { data } = await supabase.auth.getSession();
    return data.session?.user ?? null;
  }
});
