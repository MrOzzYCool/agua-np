import { AlertTriangle } from "lucide-react";
import { obtenerMorosos } from "./actions";

export default async function MorosidadPage() {
  const morosos = await obtenerMorosos();
  const deudaTotal = morosos.reduce((s, m) => s + m.deuda, 0);

  return (
    <div className="p-10">
      <div className="flex items-center justify-between mb-10">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-bold text-slate-800">Morosos</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Socios con deuda pendiente</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm">
            <span className="text-slate-500">Total:</span>
            <span className="font-bold text-amber-600 ml-1">{morosos.length}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm text-sm">
            <span className="text-slate-500">Deuda:</span>
            <span className="font-bold text-red-600 ml-1">S/ {deudaTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-amber-50/70 border-b border-amber-100">
                <th className="px-4 py-3 font-semibold text-amber-700 text-left">Nombre</th>
                <th className="px-4 py-3 font-semibold text-amber-700 text-left">DNI</th>
                <th className="px-4 py-3 font-semibold text-amber-700 text-left">Ubicación</th>
                <th className="px-4 py-3 font-semibold text-amber-700 text-right">Meses</th>
                <th className="px-4 py-3 font-semibold text-amber-700 text-right">Deuda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {morosos.length > 0 ? morosos.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3 text-slate-800 font-medium whitespace-nowrap">{m.nombre_completo}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono">{m.dni}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{m.zona} Mz{m.manzana} Lt{m.lote} Com{m.comite}</td>
                  <td className="px-4 py-3 text-right text-amber-600 font-semibold">{m.meses_pendientes}</td>
                  <td className="px-4 py-3 text-right text-red-600 font-bold">S/ {m.deuda.toFixed(2)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-emerald-500 text-sm">
                    Todos los socios están al día.
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
