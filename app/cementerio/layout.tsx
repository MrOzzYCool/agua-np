import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CementerioSidebar from "@/components/sidebars/CementerioSidebar";
import { getRoleForSubsystem } from "@/lib/utils/roles";

export default async function CementerioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre_completo, rol, roles")
    .eq("id", user.id)
    .maybeSingle();

  const rol = getRoleForSubsystem(profile, "cementerio") ?? profile?.rol ?? "administrador";
  const nombreUsuario = profile?.nombre_completo ?? user.email ?? "Usuario";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <CementerioSidebar rol={rol} nombreUsuario={nombreUsuario} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
