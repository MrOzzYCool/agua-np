import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TARIFA = 4.0;

// Usar service role para operaciones privilegiadas
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type PeriodoInput = { anio: number; mes: number };

export async function POST(request: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[YAKU] SUPABASE_SERVICE_ROLE_KEY no está configurada en .env.local");
      return NextResponse.json({ error: "Configuración del servidor incompleta. Contacte al administrador." }, { status: 500 });
    }

    const body = await request.json();
    const { socio_id, periodos, voucher_urls } = body as {
      socio_id: string;
      periodos: PeriodoInput[];
      voucher_urls: string[];
    };

    if (!socio_id) return NextResponse.json({ error: "socio_id requerido." }, { status: 400 });
    if (!periodos?.length) return NextResponse.json({ error: "Seleccione al menos un periodo." }, { status: 400 });
    if (!voucher_urls?.length) return NextResponse.json({ error: "Adjunte al menos un comprobante." }, { status: 400 });

    const supabase = getServiceClient();

    // Verificar que el socio existe y está activo
    const { data: socio } = await supabase
      .from("socios")
      .select("id, nombre_completo, estado")
      .eq("id", socio_id)
      .single();

    if (!socio) return NextResponse.json({ error: "Socio no encontrado." }, { status: 404 });
    if (socio.estado !== "activo") return NextResponse.json({ error: "Socio no activo." }, { status: 400 });

    // Verificar duplicados: revisar periodos en pagos existentes con campo 'periodos' JSONB
    // También verificar pagos legacy con anio/mes individual
    for (const p of periodos) {
      // Verificar pagos legacy (anio/mes individual)
      const { data: legacy } = await supabase
        .from("pagos")
        .select("id, estado")
        .eq("socio_id", socio_id)
        .eq("anio", p.anio)
        .eq("mes", p.mes)
        .in("estado", ["pendiente", "aprobado"])
        .maybeSingle();

      if (legacy) {
        const mesNombre = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][p.mes];
        return NextResponse.json({
          error: `Ya existe un pago ${legacy.estado} para ${mesNombre} ${p.anio}.`
        }, { status: 409 });
      }
    }

    // Insertar UN SOLO registro con todos los periodos agrupados
    const montoTotal = periodos.length * TARIFA;

    const { data: pago, error: insertError } = await supabase
      .from("pagos")
      .insert({
        socio_id,
        periodos: JSON.stringify(periodos),
        monto_total: montoTotal,
        monto: montoTotal,
        anio: periodos[0].anio,
        mes: periodos[0].mes,
        estado: "pendiente",
        voucher_url: JSON.stringify(voucher_urls),
      })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json({ error: `Error al registrar: ${insertError.message}` }, { status: 500 });
    }

    // Auditoría
    try {
      await supabase.from("historial_auditoria").insert({
        tipo_accion: "envio_pago",
        usuario_id: null,
        usuario_nombre: "Socio",
        entidad_tipo: "pago",
        entidad_id: pago.id,
        observaciones: `Pago público — ${periodos.length} periodo(s) — S/ ${montoTotal.toFixed(2)} — ${voucher_urls.length} voucher(s)`,
        estado_resultante: "pendiente",
      });
    } catch {}

    return NextResponse.json({
      success: true,
      pago_id: pago.id,
      mensaje: `Pago registrado. ${periodos.length} periodo(s) por S/ ${montoTotal.toFixed(2)} pendiente(s) de aprobación.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error("[YAKU API /api/pagos/create] Error:", message, err);
    return NextResponse.json({ error: `Error del servidor: ${message}` }, { status: 500 });
  }
}
