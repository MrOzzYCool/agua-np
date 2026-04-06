import { createClient } from "@/lib/supabase/server";
import { Users } from "lucide-react";
import SocioForm from "./socio-form";

export default async function SociosPage() {
  const supabase = await createClient();

  let socios: Record<string, unknown>[] = [];
  try {
    const { data } = await supabase.from("socios").select("*").order("created_at", { ascending: false });
    socios = data ?? [];
  } catch {
    // Si falla la query, mostrar tabla vacía
  }

  return (
    <div className="p-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Socios</h1>
          <p className="text-sm text-slate-500 mt-1">Padrón de socios del servicio de agua</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-600">
          <Users className="w-4 h-4 text-sky-500" />
          <span className="font-semibold text-slate-800">{socios.length}</span> registrados
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-7 shadow-sm mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-5">Registrar nuevo socio</h2>
        <SocioForm />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-sky-50/70 border-b border-sky-100">
                <th className="px-3 py-3 font-semibold text-sky-700 text-left">Nombre</th>
                <th className="px-3 py-3 font-semibold text-sky-700 text-left">DNI</th>
                <th className="px-3 py-3 font-semibold text-sky-700 text-left">Celular</th>
                <th className="px-3 py-3 font-semibold text-sky-700 text-left">Zona</th>
                <th className="px-3 py-3 font-semibold text-sky-700 text-left">Mz/Lt/Com</th>
                <th className="px-3 py-3 font-semibold text-sky-700 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {socios.length > 0 ? socios.map((s) => (
                <tr key={String(s.id)} className="hover:bg-slate-50/50 transition">
                  <td className="px-3 py-2.5 text-slate-800 font-medium whitespace-nowrap">{String(s.nombre_completo ?? s.nombres ?? "—")}</td>
                  <td className="px-3 py-2.5 text-slate-600 font-mono">{String(s.dni ?? "—")}</td>
                  <td className="px-3 py-2.5 text-slate-600 font-mono">{String(s.celular ?? "-")}</td>
                  <td className="px-3 py-2.5 text-slate-600">{String(s.zona ?? "-")}</td>
                  <td className="px-3 py-2.5 text-slate-600">Mz{String(s.manzana ?? "-")} Lt{String(s.lote ?? "-")} Com{String(s.comite ?? "-")}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${String(s.estado) === "activo" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {String(s.estado ?? "—")}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-3 py-12 text-center text-slate-400">No hay socios registrados aún.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
