import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export type UserProfile = {
  id: string;
  nombre_completo: string;
  rol: "tecnico" | "cobrador" | "administrador";
  estado: "activo" | "inactivo";
};

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — ignored if middleware refreshes sessions.
          }
        },
      },
    }
  );
}

export async function obtenerPerfilUsuario(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, nombre_completo, rol, estado")
    .eq("id", userId)
    .single();
  return data as UserProfile | null;
}
