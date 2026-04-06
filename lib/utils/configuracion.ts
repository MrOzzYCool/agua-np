import { createClient } from "@/lib/supabase/server";

const TARIFA_DEFAULT = 4.0;

/**
 * Obtiene la tarifa mensual desde la tabla configuracion.
 * Retorna 4.00 como fallback si no se encuentra.
 */
export async function obtenerTarifa(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("configuracion")
    .select("valor")
    .eq("clave", "tarifa_mensual")
    .single();

  if (data?.valor) {
    const parsed = parseFloat(data.valor);
    return isNaN(parsed) ? TARIFA_DEFAULT : parsed;
  }
  return TARIFA_DEFAULT;
}
