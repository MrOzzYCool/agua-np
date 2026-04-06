"use client";

import { useState } from "react";
import { Users, CreditCard, AlertTriangle, TrendingUp } from "lucide-react";
import { obtenerRecaudacionMensual, type Estadisticas, type RecaudacionMensual } from "./actions";

type Props = { stats: Estadisticas; recaudacionInicial: RecaudacionMensual[]; anioInicial: number };

export default function ReportesClient({ stats, recaudacionInicial, anioInicial }: Props) {
  const [anio, setAnio] = useState(anioInicial);
  const [recaudacion, setRecaudacion] = useState(recaudacionInicial);
  const [loading, setLoading] = useState(false);

  async function cambiarAnio(nuevoAnio: number) {
    setAnio(nuevoAnio); setLoading(true);
    const data = await obtenerRecaudacionMensual(nuevoAnio);
    setRecaudacion(data); setLoading(false);
  }

  const cards = [
    { label: "Socios Activos", value: String(stats.sociosActivos), icon: Users, bg: "bg-sky-50", ic: "text-sky-500" },
    { label: "Recaudación del Mes", value: `S/ ${stats.recaudacionMes.toFixed(2)}`, icon: CreditCard, bg: "bg-emerald-50", ic: "text-emerald-500" },
    { label: "Morosos", value: String(stats.totalMorosos), icon: AlertTriangle, bg: "bg-amber-50", ic: "text-amber-500" },
    { label: "Tasa de Pago", value: `${stats.tasaPago}%`, icon: TrendingUp, bg: "bg-violet-50", ic: "text-violet-500" },
  ];

  const totalAnual = recaudacion.reduce((s, r) => s + r.monto, 0);

  return (
    <div className="space-y-8">
      {/* Tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">{c.label}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{c.value}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.bg}`}>
                  <Icon className={`w-5 h-5 ${c.ic}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recaudación mensual */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-800">Recaudación Mensual</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => cambiarAnio(anio - 1)} disabled={loading} className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded-lg transition">←</button>
            <span className="text-sm font-bold text-slate-800 w-12 text-center">{anio}</span>
            <button onClick={() => cambiarAnio(anio + 1)} disabled={loading} className="px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded-lg transition">→</button>
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {recaudacion.map((r) => (
            <div key={r.mes} className={`rounded-xl p-3 text-center border ${r.monto > 0 ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
              <p className="text-[10px] text-slate-500 font-medium">{r.nombre.slice(0, 3)}</p>
              <p className={`text-sm font-bold mt-0.5 ${r.monto > 0 ? "text-emerald-700" : "text-slate-400"}`}>
                S/ {r.monto.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
        <p className="text-right text-sm text-slate-500 mt-3">
          Total {anio}: <span className="font-bold text-slate-800">S/ {totalAnual.toFixed(2)}</span>
        </p>
      </div>

      {/* Tabla de morosos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800">Socios Morosos ({stats.morosos.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-sky-50/70 border-b border-sky-100">
                <th className="px-4 py-3 font-semibold text-sky-700 text-left">Nombre</th>
                <th className="px-4 py-3 font-semibold text-sky-700 text-left">DNI</th>
                <th className="px-4 py-3 font-semibold text-sky-700 text-left">Ubicación</th>
                <th className="px-4 py-3 font-semibold text-sky-700 text-right">Meses</th>
                <th className="px-4 py-3 font-semibold text-sky-700 text-right">Deuda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.morosos.length > 0 ? stats.morosos.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3 text-slate-800 font-medium whitespace-nowrap">{m.nombre_completo}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono">{m.dni}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{m.zona} Mz{m.manzana} Lt{m.lote}</td>
                  <td className="px-4 py-3 text-right text-amber-600 font-semibold">{m.meses_pendientes}</td>
                  <td className="px-4 py-3 text-right text-red-600 font-bold">S/ {m.deuda.toFixed(2)}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-emerald-500 text-sm">Todos los socios están al día.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
