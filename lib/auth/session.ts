import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// getUser() verifica el token contra Supabase (red). En mobile con red
// inestable puede devolver { user: null, error } sin lanzar excepción,
// causando que el layout redirija al login innecesariamente. Si falla,
// caemos a getSession() que lee la cookie local sin red.
export const getAuthUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();

  const { data: getUserData } = await supabase.auth.getUser();
  if (getUserData.user) return getUserData.user;

  const { data: sessionData } = await supabase.auth.getSession();
  return sessionData.session?.user ?? null;
});
