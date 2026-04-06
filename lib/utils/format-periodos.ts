const MESES_CORTO = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export function parsePeriodos(raw: unknown, anio?: number, mes?: number): { anio: number; mes: number }[] {
  if (raw) {
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  if (anio && mes) return [{ anio, mes }];
  return [];
}

export function formatPeriodos(periodos: { anio: number; mes: number }[]): string {
  if (periodos.length === 0) return "—";
  if (periodos.length === 1) return `${MESES_CORTO[periodos[0].mes]} ${periodos[0].anio}`;
  const sorted = [...periodos].sort((a, b) => a.anio - b.anio || a.mes - b.mes);
  return sorted.map((p) => `${MESES_CORTO[p.mes]} ${p.anio}`).join(", ");
}
