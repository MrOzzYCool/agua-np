import { createClient as createBrowserClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase público (anon key) para operaciones sin autenticación.
 * Usado por el formulario público /pagar.
 */
export function createPublicClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
