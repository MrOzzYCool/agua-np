import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userId = user.id;
  const userEmail = user.email ?? "Usuario";

  // Consultar solo public.profiles — NO auth.users
  const { data: profile } = await supabase
    .from("profiles")
    .select("nombre_completo, rol")
    .eq("id", userId)
    .maybeSingle();

  const rol = profile?.rol ?? "administrador";
  const nombreUsuario = profile?.nombre_completo ?? userEmail;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar rol={rol} nombreUsuario={nombreUsuario} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
