const PERMISSION_DENIED_PATTERN = /permission denied for table/i;

export function formatSupabaseError(message: string): string {
  if (PERMISSION_DENIED_PATTERN.test(message)) {
    return [
      "Supabase no tiene permisos configurados en la tabla.",
      "Abrí Supabase → SQL Editor, ejecutá scripts/supabase-setup.sql y volvé a intentar.",
    ].join(" ");
  }

  return message;
}
