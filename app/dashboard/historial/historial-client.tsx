"use client";

import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { obtenerHistorial, type RegistroAuditoria } from "./actions";

const TIPOS = [
  { value: "", label: "Todos" },
  { value: "registro_socio", label: "Registro de socio" },
  { value: "envio_pago", label: "Envío de pago" },
  { value: "aprobacion_pago", label: "Aprobación de pago" },
  { value: "rechazo_pago", label: "Rechazo de pago" },
  { value: "cambio_estado_socio", label: "Cambio de estado" },
];

const TIPO_LABELS: Record<string, string> = {
  registro_socio: "Registro socio",
  envio_pago: "Envío pago",
  aprobacion_pago: "Aprobación",
  rechazo_pago: "Rechazo",
  cambio_estado_socio: "Cambio estado",
};

const TIPO_COLORS: Record<string, string> = {
  registro_socio: "bg-sky-100 text-sky-700",
  envio_pago: "bg-amber-100 text-amber-700",
  aprobacion_pago: "bg-emerald-100 text-emerald-700",
  rechazo_pago: "bg-red-100 text-red-700",
  cambio_estado_socio: "bg-violet-100 text-violet-700",
};

const inputCls = "px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-sm text-slate-900";

type Props = { registrosIniciales: RegistroAuditoria[] };

export default function HistorialClient({ registrosIniciales }: Props) {
  const [registros, setRegistros] = useState(registrosIniciales);
  const [tipo, setTipo] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [usuario, setUsuario] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFiltrar() {
    setLoading(true);
    const data = await obtenerHistorial({
      tipo_accion: tipo || undefined,
      fecha_desde: desde || undefined,
      fecha_hasta: hasta || undefined,
      usuario_nombre: usuario || undefined,
    });
    setRegistros(data);
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">Filtros</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputCls}>
            {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} placeholder="Desde" className={inputCls} />
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} placeholder="Hasta" className={inputCls} />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" value={usuario} onChange={(e) => setUsuario(e.target.value)}
              placeholder="Usuario..." className={`${inputCls} pl-9 w-full`} />
          </div>
          <button onClick={handleFiltrar} disabled={loading}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-medium rounded-xl transition text-sm">
            {loading ? "..." : "Filtrar"}
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-sky-50/70 border-b border-sky-100">
                <th className="px-4 py-3 font-semibold text-sky-700 text-left">Acción</th>
                <th className="px-4 py-3 font-semibold text-sky-700 text-left">Usuario</th>
                <th className="px-4 py-3 font-semibold text-sky-700 text-left">Fecha</th>
                <th className="px-4 py-3 font-semibold text-sky-700 text-left">Entidad</th>
                <th className="px-4 py-3 font-semibold text-sky-700 text-left">Observaciones</th>
                <th className="px-4 py-3 font-semibold text-sky-700 text-left">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registros.length > 0 ? registros.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${TIPO_COLORS[r.tipo_accion] ?? "bg-slate-100 text-slate-600"}`}>
                      {TIPO_LABELS[r.tipo_accion] ?? r.tipo_accion}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{r.usuario_nombre}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3 text-slate-500 capitalize">{r.entidad_tipo}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{r.observaciones ?? "—"}</td>
                  <td className="px-4 py-3">
                    {r.estado_resultante ? (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        r.estado_resultante === "aprobado" ? "bg-emerald-100 text-emerald-700"
                        : r.estado_resultante === "rechazado" ? "bg-red-100 text-red-700"
                        : r.estado_resultante === "activo" ? "bg-sky-100 text-sky-700"
                        : "bg-slate-100 text-slate-600"
                      }`}>{r.estado_resultante}</span>
                    ) : "—"}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No se encontraron registros.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
          {registros.length} registro(s)
        </div>
      </div>
    </div>
  );
}
