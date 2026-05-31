import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import YakuSidebar from "@/components/sidebars/YakuSidebar";
import { getRoleForSubsystem } from "@/lib/utils/roles";

export default async function YakuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let rol = "administrador";
  let nombreUsuario = user.email ?? "Usuario";

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("nombre_completo, rol, roles")
      .eq("id", user.id)
      .maybeSingle();

    rol = getRoleForSubsystem(profile, "yaku") ?? profile?.rol ?? "administrador";
    nombreUsuario = profile?.nombre_completo ?? user.email ?? "Usuario";
  } catch {
    // Si falla la query, usar defaults
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <YakuSidebar rol={rol} nombreUsuario={nombreUsuario} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
