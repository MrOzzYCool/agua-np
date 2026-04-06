"use client";

type Socio = {
  id: string;
  nombre_completo: string;
  dni: string;
  celular: string | null;
  zona: string | null;
  manzana: string | null;
  lote: string | null;
  comite: string | null;
  estado: string;
};

export default function SociosTable({ socios }: { socios: Socio[] }) {
  const h = "px-3 py-3 font-semibold text-sky-700 text-left";
  const c = "px-3 py-2.5 text-slate-600";
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-sky-50/70 border-b border-sky-100">
              <th className={h}>Nombre</th>
              <th className={h}>DNI</th>
              <th className={h}>Celular</th>
              <th className={h}>Zona</th>
              <th className={h}>Manzana</th>
              <th className={h}>Lote</th>
              <th className={h}>Comité</th>
              <th className={h}>Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {socios.length > 0 ? socios.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/50 transition">
                <td className={`${c} font-medium text-slate-800 whitespace-nowrap`}>{s.nombre_completo}</td>
                <td className={`${c} font-mono`}>{s.dni}</td>
                <td className={`${c} font-mono`}>{s.celular ?? "-"}</td>
                <td className={`${c} whitespace-nowrap`}>{s.zona ?? "-"}</td>
                <td className={c}>{s.manzana ?? "-"}</td>
                <td className={c}>{s.lote ?? "-"}</td>
                <td className={c}>{s.comite ?? "-"}</td>
                <td className="px-3 py-2.5">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${s.estado === "activo" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {s.estado}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={8} className="px-3 py-12 text-center text-slate-400">
                  No hay socios registrados aún.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
