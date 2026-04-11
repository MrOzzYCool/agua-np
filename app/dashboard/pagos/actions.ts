"use server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { calcularPeriodosPendientes, type PeriodoMensual } from "@/lib/utils/periodos";
import { obtenerTarifa } from "@/lib/utils/configuracion";
import { parsePeriodos } from "@/lib/utils/format-periodos";
function getAdminClient() { return createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!); }
export type { PeriodoMensual } from "@/lib/utils/periodos";
export type PagoResult = { error?: string; success?: boolean; pagoIds?: string[]; socioNombre?: string; socioDni?: string; socioZona?: string; socioUbicacion?: string; periodos?: PeriodoMensual[]; montoTotal?: number; metodoPago?: string; fecha?: string; comprobante?: string; tarifa?: number; };
export type PagoPendienteView = { id: string; socio_nombre: string; socio_dni: string; periodos: { anio: number; mes: number }[]; monto_total: number; voucher_url: string | null; created_at: string; };
export type AccionResult = { success?: boolean; error?: string };
export async function buscarSocios(query: string) { if (!query || query.trim().length < 2) return []; const supabase = await createClient(); const term = `%${query.trim()}%`; const { data } = await supabase.from("socios").select("id, nombre_completo, dni, zona, manzana, lote, comite, fecha_inicio, estado").eq("estado", "activo").or(`nombre_completo.ilike.${term},dni.ilike.${term}`).limit(10); return data ?? []; }
export async function obtenerPeriodosPendientes(socioId: string, fechaInicio: string) { const supabase = await createClient(); const { data: pagos } = await supabase.from("pagos").select("anio, mes").eq("socio_id", socioId).eq("estado", "aprobado"); return calcularPeriodosPendientes(fechaInicio, pagos ?? []); }
export async function obtenerTarifaActual() { return await obtenerTarifa(); }

export async function registrarPagos(socioId: string, periodos: PeriodoMensual[], metodoPago: string): Promise<PagoResult> {
  if (!periodos.length) return { error: "Seleccione al menos un periodo." };
  const supabase = await createClient(); const tarifa = await obtenerTarifa();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada." };
  const { data: socio } = await supabase.from("socios").select("nombre_completo, dni, zona, manzana, lote, comite, estado").eq("id", socioId).single();
  if (!socio) return { error: "Socio no encontrado." };
  if (socio.estado !== "activo") return { error: "Socios inactivos no pueden pagar." };
  const { count } = await supabase.from("pagos").select("id", { count: "exact", head: true });
  const comprobante = `REC-${((count ?? 0) + 1).toString().padStart(4, "0")}`;
  const registros = periodos.map((p) => ({ socio_id: socioId, anio: p.anio, mes: p.mes, monto: tarifa, estado: "aprobado", metodo_pago: metodoPago, numero_comprobante: `${comprobante}-${p.anio}${p.mes.toString().padStart(2, "0")}`, registrado_por: user.id }));
  const { data: ins, error } = await supabase.from("pagos").insert(registros).select("id");
  if (error) return { error: error.code === "23505" ? "Periodos ya pagados." : "Error al registrar." };
  revalidatePath("/dashboard/pagos"); revalidatePath("/dashboard");
  return { success: true, pagoIds: ins?.map((p) => p.id) ?? [], socioNombre: socio.nombre_completo, socioDni: socio.dni, socioZona: socio.zona, socioUbicacion: `Mz ${socio.manzana} Lt ${socio.lote} Com ${socio.comite}`, periodos, montoTotal: periodos.length * tarifa, metodoPago, comprobante, tarifa, fecha: new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" }) };
}
export async function obtenerPagosPendientes(): Promise<PagoPendienteView[]> {
  const supabase = await createClient();
  const { data: pagos } = await supabase.from("pagos").select("id, socio_id, anio, mes, monto, monto_total, periodos, voucher_url, created_at").eq("estado", "pendiente").order("created_at", { ascending: true });
  if (!pagos || pagos.length === 0) return [];
  const ids = [...new Set(pagos.map((p) => p.socio_id))];
  const { data: socios } = await supabase.from("socios").select("id, nombre_completo, dni").in("id", ids);
  const m = new Map((socios ?? []).map((s) => [s.id, s]));
  return pagos.map((p) => { const s = m.get(p.socio_id); return { id: p.id, socio_nombre: s?.nombre_completo ?? "—", socio_dni: s?.dni ?? "—", periodos: parsePeriodos(p.periodos, p.anio, p.mes), monto_total: Number(p.monto_total ?? p.monto ?? 0), voucher_url: p.voucher_url, created_at: p.created_at }; });
}

export async function obtenerSignedUrls(raw: string | null): Promise<string[]> {
  if (!raw) return [];
  let paths: string[] = [];
  try { const p = JSON.parse(raw); if (Array.isArray(p)) paths = p; } catch { if (raw.includes(",")) paths = raw.split(",").map((u) => u.trim()).filter(Boolean); else paths = [raw]; }
  if (!paths.length) return [];
  const admin = getAdminClient(); const urls: string[] = [];
  for (const r of paths) { let sp = r; if (r.includes("/storage/v1/object/public/vouchers/")) sp = r.split("/storage/v1/object/public/vouchers/")[1]; else if (r.includes("/vouchers/")) sp = r.split("/vouchers/").pop() ?? r; if (!sp.startsWith("socios/") && !sp.includes("/")) sp = `socios/${sp}`; const { data, error } = await admin.storage.from("vouchers").createSignedUrl(sp, 60); if (data?.signedUrl) urls.push(data.signedUrl); else { console.error("[YAKU] signedUrl:", sp, error?.message); urls.push(r); } }
  return urls;
}
export async function aprobarPago(pagoId: string, observaciones: string): Promise<AccionResult> {
  if (!observaciones?.trim()) return { error: "Observaciones obligatorias." };
  try { const admin = getAdminClient(); const { error } = await admin.from("pagos").update({ estado: "aprobado", observaciones: observaciones.trim(), fecha_aprobacion: new Date().toISOString() }).eq("id", pagoId); if (error) return { error: `Error: ${error.message}` }; try { await admin.from("historial_auditoria").insert({ tipo_accion: "aprobacion_pago", usuario_nombre: "Admin", entidad_tipo: "pago", entidad_id: pagoId, observaciones: observaciones.trim(), estado_resultante: "aprobado" }); } catch {} revalidatePath("/dashboard/pagos"); revalidatePath("/dashboard"); return { success: true }; } catch (err) { return { error: `Error: ${(err as Error).message}` }; }
}
export async function rechazarPago(pagoId: string, observaciones: string): Promise<AccionResult> {
  if (!observaciones?.trim()) return { error: "Observaciones obligatorias." };
  try { const admin = getAdminClient(); const { error } = await admin.from("pagos").update({ estado: "rechazado", observaciones: observaciones.trim(), fecha_aprobacion: new Date().toISOString() }).eq("id", pagoId).eq("estado", "pendiente"); if (error) return { error: `Error: ${error.message}` }; try { await admin.from("historial_auditoria").insert({ tipo_accion: "rechazo_pago", usuario_nombre: "Admin", entidad_tipo: "pago", entidad_id: pagoId, observaciones: observaciones.trim(), estado_resultante: "rechazado" }); } catch {} revalidatePath("/dashboard/pagos"); return { success: true }; } catch (err) { return { error: `Error: ${(err as Error).message}` }; }
}
