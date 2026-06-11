import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Usamos getSession() en lugar de getUser() para evitar llamadas de red
// a Supabase en cada Server Component. getUser() hace una request HTTP que
// puede tardar 1-5s o fallar, colgando el render RSC y causando "can't load"
// en navegación cliente. getSession() lee el JWT de la cookie (instantáneo).
// La verificación server-side del token ocurre en los middlewares de Supabase.
export const getAuthUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  return sessionData.session?.user ?? null;
});
