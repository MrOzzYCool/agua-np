"use server";

import { createClient } from "@/lib/supabase/server";
import { calcularPeriodosPendientes, calcularDeudaTotal } from "@/lib/utils/periodos";
import { obtenerTarifa } from "@/lib/utils/configuracion";

export type SocioMoroso = {
  id: string;
  nombre_completo: string;
  dni: string;
  zona: string;
  manzana: string;
  lote: string;
  comite: string;
  meses_pendientes: number;
  deuda: number;
};

export async function obtenerMorosos(): Promise<SocioMoroso[]> {
  const supabase = await createClient();
  const tarifa = await obtenerTarifa();

  const { data: socios } = await supabase
    .from("socios")
    .select("id, nombre_completo, dni, zona, manzana, lote, comite, fecha_inicio")
    .eq("estado", "activo");

  if (!socios) return [];

  const morosos: SocioMoroso[] = [];

  for (const s of socios) {
    const { data: pagos } = await supabase
      .from("pagos")
      .select("anio, mes")
      .eq("socio_id", s.id)
      .eq("estado", "aprobado");

    const pendientes = calcularPeriodosPendientes(s.fecha_inicio, pagos ?? []);
    if (pendientes.length > 0) {
      morosos.push({
        id: s.id,
        nombre_completo: s.nombre_completo,
        dni: s.dni,
        zona: s.zona,
        manzana: s.manzana,
        lote: s.lote,
        comite: s.comite,
        meses_pendientes: pendientes.length,
        deuda: calcularDeudaTotal(pendientes, tarifa),
      });
    }
  }

  return morosos.sort((a, b) => b.deuda - a.deuda);
}
