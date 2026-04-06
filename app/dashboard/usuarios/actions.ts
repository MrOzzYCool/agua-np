"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type UsuarioView = {
  id: string;
  nombre_completo: string;
  rol: string;
  estado: string;
  created_at: string;
};

export type AccionResult = { success?: boolean; error?: string };

export async function obtenerUsuarios(): Promise<UsuarioView[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, nombre_completo, rol, estado, created_at")
    .order("created_at", { ascending: false });
  return (data as UsuarioView[]) ?? [];
}

export async function obtenerUsuarioActual(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function cambiarRol(userId: string, nuevoRol: string): Promise<AccionResult> {
  if (!["tecnico", "cobrador", "administrador"].includes(nuevoRol)) {
    return { error: "Rol inválido." };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada." };
  const currentUserId = user.id;

  if (currentUserId === userId) return { error: "No puede cambiar su propio rol." };

  const { data: profile } = await supabase
    .from("profiles").select("nombre_completo, rol").eq("id", userId).maybeSingle();
  if (!profile) return { error: "Usuario no encontrado." };

  const { error } = await supabase
    .from("profiles").update({ rol: nuevoRol, updated_at: new Date().toISOString() }).eq("id", userId);
  if (error) return { error: "Error al cambiar el rol." };

  try {
    const { data: admin } = await supabase.from("profiles").select("nombre_completo").eq("id", currentUserId).maybeSingle();
    await supabase.from("historial_auditoria").insert({
      tipo_accion: "cambio_estado_socio", usuario_id: currentUserId,
      usuario_nombre: admin?.nombre_completo ?? "Admin", entidad_tipo: "socio", entidad_id: userId,
      observaciones: `Cambio de rol: ${profile.rol} → ${nuevoRol} para ${profile.nombre_completo}`,
      estado_resultante: nuevoRol,
    });
  } catch {}

  revalidatePath("/dashboard/usuarios");
  return { success: true };
}

export async function cambiarEstadoUsuario(userId: string, nuevoEstado: string): Promise<AccionResult> {
  if (!["activo", "inactivo"].includes(nuevoEstado)) return { error: "Estado inválido." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada." };
  const currentUserId = user.id;

  if (currentUserId === userId && nuevoEstado === "inactivo") {
    return { error: "No puede desactivar su propia cuenta." };
  }

  if (nuevoEstado === "inactivo") {
    const { data: target } = await supabase.from("profiles").select("rol").eq("id", userId).maybeSingle();
    if (target?.rol === "administrador") {
      const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true }).eq("rol", "administrador").eq("estado", "activo");
      if ((count ?? 0) <= 1) return { error: "No se puede desactivar al único administrador activo." };
    }
  }

  const { data: profile } = await supabase.from("profiles").select("nombre_completo").eq("id", userId).maybeSingle();
  const { error } = await supabase.from("profiles").update({ estado: nuevoEstado, updated_at: new Date().toISOString() }).eq("id", userId);
  if (error) return { error: "Error al cambiar el estado." };

  try {
    const { data: admin } = await supabase.from("profiles").select("nombre_completo").eq("id", currentUserId).maybeSingle();
    await supabase.from("historial_auditoria").insert({
      tipo_accion: "cambio_estado_socio", usuario_id: currentUserId,
      usuario_nombre: admin?.nombre_completo ?? "Admin", entidad_tipo: "socio", entidad_id: userId,
      observaciones: `Estado cambiado a ${nuevoEstado} para ${profile?.nombre_completo}`,
      estado_resultante: nuevoEstado,
    });
  } catch {}

  revalidatePath("/dashboard/usuarios");
  return { success: true };
}
