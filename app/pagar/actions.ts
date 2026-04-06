"use server";

import { createClient } from "@/lib/supabase/server";
import { calcularPeriodosPendientes, calcularDeudaTotal, type PeriodoMensual } from "@/lib/utils/periodos";

export type { PeriodoMensual } from "@/lib/utils/periodos";

const TARIFA = 4.0;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export type SocioPublico = {
  id: string;
  nombre_completo: string;
  zona: string;
  manzana: string;
  lote: string;
  comite: string;
  periodosPendientes: PeriodoMensual[];
  deudaTotal: number;
  tarifa: number;
};

export type BusquedaResult = {
  socio?: SocioPublico;
  error?: string;
};

export async function buscarSocioPorDni(dni: string): Promise<BusquedaResult> {
  if (!dni || !/^\d{8}$/.test(dni)) {
    return { error: "Ingrese un DNI válido de 8 dígitos." };
  }

  const supabase = await createClient();

  const { data: socio } = await supabase
    .from("socios")
    .select("id, nombre_completo, zona, manzana, lote, comite, estado, fecha_inicio")
    .eq("dni", dni)
    .single();

  if (!socio) {
    return { error: "El DNI ingresado no se encuentra en el padrón de la asociación." };
  }

  if (socio.estado !== "activo") {
    return { error: "Este socio no está activo en el sistema." };
  }

  // Solo pagos aprobados se descuentan
  const { data: pagos } = await supabase
    .from("pagos")
    .select("anio, mes")
    .eq("socio_id", socio.id)
    .eq("estado", "aprobado");

  const periodosPendientes = calcularPeriodosPendientes(socio.fecha_inicio, pagos ?? []);
  const deudaTotal = calcularDeudaTotal(periodosPendientes, TARIFA);

  return {
    socio: {
      id: socio.id,
      nombre_completo: socio.nombre_completo,
      zona: socio.zona,
      manzana: socio.manzana,
      lote: socio.lote,
      comite: socio.comite,
      periodosPendientes,
      deudaTotal,
      tarifa: TARIFA,
    },
  };
}

export type PagoPublicoResult = {
  success?: boolean;
  error?: string;
  mensaje?: string;
};

export async function enviarPagoPublico(
  socioId: string,
  periodos: PeriodoMensual[],
  voucherUrls: string[]
): Promise<PagoPublicoResult> {
  if (!periodos.length) return { error: "Seleccione al menos un periodo para pagar." };
  if (!voucherUrls.length) return { error: "Debe adjuntar al menos un comprobante de pago." };

  const supabase = await createClient();

  // Verificar que no existan pagos pendientes duplicados
  for (const p of periodos) {
    const { data: existente } = await supabase
      .from("pagos")
      .select("id")
      .eq("socio_id", socioId)
      .eq("anio", p.anio)
      .eq("mes", p.mes)
      .eq("estado", "pendiente")
      .maybeSingle();

    if (existente) {
      return { error: `Ya existe un pago pendiente de aprobación para ${p.mes}/${p.anio}.` };
    }
  }

  // Guardar URLs como JSON array en voucher_url
  const registros = periodos.map((p) => ({
    socio_id: socioId,
    anio: p.anio,
    mes: p.mes,
    monto: TARIFA,
    estado: "pendiente",
    voucher_url: JSON.stringify(voucherUrls),
  }));

  const { data: pagosInsertados, error: insertError } = await supabase
    .from("pagos")
    .insert(registros)
    .select("id");

  if (insertError) {
    return { error: `Error al registrar el pago: ${insertError.message}` };
  }

  // Registrar auditoría
  if (pagosInsertados) {
    try {
      const auditorias = pagosInsertados.map((pago) => ({
        tipo_accion: "envio_pago" as const,
        usuario_id: null,
        usuario_nombre: "Socio",
        entidad_tipo: "pago" as const,
        entidad_id: pago.id,
        observaciones: `Pago público — ${periodos.length} periodo(s) — S/ ${(periodos.length * TARIFA).toFixed(2)} — ${voucherUrls.length} voucher(s)`,
        estado_resultante: "pendiente",
      }));
      await supabase.from("historial_auditoria").insert(auditorias);
    } catch {}
  }

  return {
    success: true,
    mensaje: `Pago enviado correctamente. ${periodos.length} periodo(s) por S/ ${(periodos.length * TARIFA).toFixed(2)} con ${voucherUrls.length} comprobante(s). Pendiente de aprobación.`,
  };
}
