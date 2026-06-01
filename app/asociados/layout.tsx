import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AsociadosSidebar from "@/components/sidebars/AsociadosSidebar";

export default async function AsociadosLayout({
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
      .select("nombre_completo, rol")
      .eq("id", user.id)
      .maybeSingle();

    rol = profile?.rol ?? "administrador";
    nombreUsuario = profile?.nombre_completo ?? user.email ?? "Usuario";
  } catch {
    // usar defaults
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AsociadosSidebar rol={rol} nombreUsuario={nombreUsuario} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
