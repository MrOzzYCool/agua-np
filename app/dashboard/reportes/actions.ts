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
  meses_pendientes: number;
  deuda: number;
};

export type Estadisticas = {
  sociosActivos: number;
  recaudacionMes: number;
  totalMorosos: number;
  tasaPago: number;
  tarifa: number;
  morosos: SocioMoroso[];
};

export async function obtenerEstadisticas(): Promise<Estadisticas> {
  const supabase = await createClient();
  const tarifa = await obtenerTarifa();
  const now = new Date();
  const mesActual = now.getMonth() + 1;
  const anioActual = now.getFullYear();

  // Socios activos
  const { data: socios } = await supabase
    .from("socios")
    .select("id, nombre_completo, dni, zona, manzana, lote, fecha_inicio")
    .eq("estado", "activo");

  const sociosActivos = socios?.length ?? 0;

  // Recaudación del mes (pagos aprobados)
  const { data: pagosMes } = await supabase
    .from("pagos")
    .select("monto")
    .eq("anio", anioActual)
    .eq("mes", mesActual)
    .eq("estado", "aprobado");

  const recaudacionMes = (pagosMes ?? []).reduce((s, p) => s + Number(p.monto), 0);

  // Calcular morosos
  const morosos: SocioMoroso[] = [];
  let sociosAlDia = 0;

  if (socios) {
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
          meses_pendientes: pendientes.length,
          deuda: calcularDeudaTotal(pendientes, tarifa),
        });
      } else {
        sociosAlDia++;
      }
    }
  }

  morosos.sort((a, b) => b.deuda - a.deuda);
  const tasaPago = sociosActivos > 0 ? Math.round((sociosAlDia / sociosActivos) * 100) : 0;

  return { sociosActivos, recaudacionMes, totalMorosos: morosos.length, tasaPago, tarifa, morosos };
}

export type RecaudacionMensual = { mes: number; nombre: string; monto: number };

const MESES_NOMBRE = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export async function obtenerRecaudacionMensual(anio: number): Promise<RecaudacionMensual[]> {
  const supabase = await createClient();

  const { data: pagos } = await supabase
    .from("pagos")
    .select("mes, monto")
    .eq("anio", anio)
    .eq("estado", "aprobado");

  const porMes: Record<number, number> = {};
  (pagos ?? []).forEach((p) => {
    porMes[p.mes] = (porMes[p.mes] ?? 0) + Number(p.monto);
  });

  return Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1,
    nombre: MESES_NOMBRE[i + 1],
    monto: porMes[i + 1] ?? 0,
  }));
}
