import { createClient } from "@/lib/supabase/server";
import { UserCheck } from "lucide-react";
import AsociadoForm from "./asociado-form";

export default async function RegistroAsociadosPage() {
  const supabase = await createClient();

  let asociados: Record<string, unknown>[] = [];
  try {
    const { data } = await supabase
      .from("asociados")
      .select("*")
      .order("created_at", { ascending: false });
    asociados = data ?? [];
  } catch {
    // tabla aún no existe o error de conexión
  }

  return (
    <div className="p-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Registro de Asociados</h1>
          <p className="text-sm text-slate-500 mt-1">Padrón de asociados de la Asociación AAHH Nicolás de Piérola</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-600">
          <UserCheck className="w-4 h-4 text-violet-500" />
          <span className="font-semibold text-slate-800">{asociados.length}</span> registrados
        </div>
      </div>

      {/* Formulario de registro */}
      <div className="bg-white rounded-xl border border-slate-200 p-7 shadow-sm mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-5">Inscribir nuevo asociado</h2>
        <AsociadoForm />
      </div>

      {/* Tabla de asociados */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-violet-50/70 border-b border-violet-100">
                <th className="px-3 py-3 font-semibold text-violet-700 text-left">N° Asoc.</th>
                <th className="px-3 py-3 font-semibold text-violet-700 text-left">Nombre</th>
                <th className="px-3 py-3 font-semibold text-violet-700 text-left">DNI</th>
                <th className="px-3 py-3 font-semibold text-violet-700 text-left">Celular</th>
                <th className="px-3 py-3 font-semibold text-violet-700 text-left">Zona</th>
                <th className="px-3 py-3 font-semibold text-violet-700 text-left">Mz/Lt/Com</th>
                <th className="px-3 py-3 font-semibold text-violet-700 text-left">F. Inscripción</th>
                <th className="px-3 py-3 font-semibold text-violet-700 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {asociados.length > 0 ? asociados.map((a) => (
                <tr key={String(a.id)} className="hover:bg-slate-50/50 transition">
                  <td className="px-3 py-2.5 font-mono font-semibold text-violet-600">
                    {String(a.numero_asociado ?? "—")}
                  </td>
                  <td className="px-3 py-2.5 text-slate-800 font-medium whitespace-nowrap">
                    {String(a.nombre_completo ?? "—")}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 font-mono">{String(a.dni ?? "—")}</td>
                  <td className="px-3 py-2.5 text-slate-600 font-mono">{String(a.celular ?? "-")}</td>
                  <td className="px-3 py-2.5 text-slate-600">{String(a.zona ?? "-")}</td>
                  <td className="px-3 py-2.5 text-slate-600">
                    Mz{String(a.manzana ?? "-")} Lt{String(a.lote ?? "-")} Com{String(a.comite ?? "-")}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600">
                    {a.fecha_inscripcion ? new Date(String(a.fecha_inscripcion)).toLocaleDateString("es-PE") : "-"}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      String(a.estado) === "activo" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {String(a.estado ?? "—")}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-3 py-12 text-center text-slate-400">
                    No hay asociados registrados aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
