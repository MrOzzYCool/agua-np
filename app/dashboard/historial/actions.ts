"use server";

import { createClient } from "@/lib/supabase/server";

export type FiltrosAuditoria = {
  tipo_accion?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  usuario_nombre?: string;
};

export type RegistroAuditoria = {
  id: string;
  tipo_accion: string;
  usuario_nombre: string;
  entidad_tipo: string;
  entidad_id: string;
  observaciones: string | null;
  estado_resultante: string | null;
  created_at: string;
};

export async function obtenerHistorial(
  filtros?: FiltrosAuditoria
): Promise<RegistroAuditoria[]> {
  const supabase = await createClient();

  let query = supabase
    .from("historial_auditoria")
    .select("id, tipo_accion, usuario_nombre, entidad_tipo, entidad_id, observaciones, estado_resultante, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (filtros?.tipo_accion) {
    query = query.eq("tipo_accion", filtros.tipo_accion);
  }
  if (filtros?.fecha_desde) {
    query = query.gte("created_at", filtros.fecha_desde + "T00:00:00");
  }
  if (filtros?.fecha_hasta) {
    query = query.lte("created_at", filtros.fecha_hasta + "T23:59:59");
  }
  if (filtros?.usuario_nombre) {
    query = query.ilike("usuario_nombre", `%${filtros.usuario_nombre}%`);
  }

  const { data } = await query;
  return (data as RegistroAuditoria[]) ?? [];
}
