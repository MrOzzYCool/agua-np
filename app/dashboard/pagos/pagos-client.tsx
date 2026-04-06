"use client";

import { useState, useCallback } from "react";
import { Search, Check, Printer } from "lucide-react";
import {
  buscarSocios,
  obtenerPeriodosPendientes,
  registrarPagos,
  type PeriodoMensual,
  type PagoResult,
} from "./actions";

type Socio = {
  id: string;
  nombre_completo: string;
  dni: string;
  zona: string;
  manzana: string;
  lote: string;
  comite: string;
  fecha_inicio: string;
  estado: string;
};

const MESES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function PagosClient() {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Socio[]>([]);
  const [socioSeleccionado, setSocioSeleccionado] = useState<Socio | null>(null);
  const [periodosPendientes, setPeriodosPendientes] = useState<PeriodoMensual[]>([]);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [loading, setLoading] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState<PagoResult | null>(null);

  const handleBuscar = useCallback(async () => {
    if (query.trim().length < 2) return;
    setBuscando(true);
    const data = await buscarSocios(query);
    setResultados(data);
    setBuscando(false);
  }, [query]);

  async function handleSeleccionarSocio(socio: Socio) {
    setSocioSeleccionado(socio);
    setResultados([]);
    setQuery("");
    setResultado(null);
    setSeleccionados(new Set());

    const pendientes = await obtenerPeriodosPendientes(socio.id, socio.fecha_inicio);
    setPeriodosPendientes(pendientes);
  }

  function togglePeriodo(key: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function seleccionarTodos() {
    if (seleccionados.size === periodosPendientes.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(periodosPendientes.map((p) => `${p.anio}-${p.mes}`)));
    }
  }

  async function handleRegistrarPago() {
    if (!socioSeleccionado || seleccionados.size === 0) return;
    setLoading(true);

    const periodos = Array.from(seleccionados).map((key) => {
      const [anio, mes] = key.split("-").map(Number);
      return { anio, mes };
    });

    const res = await registrarPagos(socioSeleccionado.id, periodos, metodoPago);
    setResultado(res);

    if (res.success) {
      setPeriodosPendientes((prev) =>
        prev.filter((p) => !seleccionados.has(`${p.anio}-${p.mes}`))
      );
      setSeleccionados(new Set());
    }
    setLoading(false);
  }

  function handleImprimir() {
    if (!resultado?.success) return;
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;

    const periodosTexto = resultado.periodos!
      .map((p) => `${MESES[p.mes]} ${p.anio}`)
      .join(", ");

    win.document.write(`<!DOCTYPE html>
<html><head><title>Recibo YAKU</title>
<style>
  body { font-family: Arial, sans-serif; padding: 24px; color: #1e293b; }
  .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0ea5e9; padding-bottom: 16px; }
  .logo { font-size: 28px; font-weight: 800; color: #0ea5e9; }
  .subtitle { font-size: 11px; color: #64748b; }
  .field { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
  .label { color: #64748b; }
  .value { font-weight: 600; }
  .total { font-size: 18px; font-weight: 700; text-align: center; margin: 16px 0; color: #0ea5e9; }
  .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  @media print { body { padding: 0; } }
</style></head><body>
  <div class="header">
    <div class="logo">YAKU</div>
    <div class="subtitle">Sistema Integral de Agua<br/>Asociación AAHH Nicolás de Piérola</div>
    <div style="margin-top:8px;font-size:14px;font-weight:700;color:#0ea5e9;">N° ${resultado.comprobante}</div>
  </div>
  <div class="field"><span class="label">Socio:</span><span class="value">${resultado.socioNombre}</span></div>
  <div class="field"><span class="label">DNI:</span><span class="value">${resultado.socioDni}</span></div>
  <div class="field"><span class="label">Ubicación:</span><span class="value">${resultado.socioZona} · ${resultado.socioUbicacion}</span></div>
  <div class="field"><span class="label">Periodos:</span><span class="value">${periodosTexto}</span></div>
  <div class="field"><span class="label">Método:</span><span class="value">${resultado.metodoPago}</span></div>
  <div class="field"><span class="label">Fecha:</span><span class="value">${resultado.fecha}</span></div>
  <div class="total">Total: S/ ${resultado.montoTotal!.toFixed(2)}</div>
  <div class="footer">
    Documento sin validez fiscal<br/>
    YAKU — Sistema Integral de Agua v1.0
  </div>
</body></html>`);
    win.document.close();
    win.print();
  }

  function handleNuevoPago() {
    setSocioSeleccionado(null);
    setPeriodosPendientes([]);
    setSeleccionados(new Set());
    setResultado(null);
    setQuery("");
  }

  // --- RENDER ---

  // Show receipt after successful payment
  if (resultado?.success) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-1">Pago registrado</h2>
        <p className="text-slate-500 text-sm mb-6">
          Se registraron {resultado.periodos!.length} periodo(s) para {resultado.socioNombre}
        </p>

        <div className="bg-slate-50 rounded-xl p-5 text-left text-sm space-y-2 mb-6 max-w-sm mx-auto">
          <div className="flex justify-between"><span className="text-slate-500">N° Comprobante:</span><span className="font-bold text-sky-600">{resultado.comprobante}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Socio:</span><span className="font-medium text-slate-800">{resultado.socioNombre}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">DNI:</span><span className="font-mono text-slate-800">{resultado.socioDni}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Ubicación:</span><span className="text-slate-800">{resultado.socioZona} · {resultado.socioUbicacion}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Método:</span><span className="text-slate-800 capitalize">{resultado.metodoPago}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Fecha:</span><span className="text-slate-800">{resultado.fecha}</span></div>
          <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
            <span className="text-slate-500 font-medium">Total:</span>
            <span className="font-bold text-sky-600 text-base">S/ {resultado.montoTotal!.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={handleImprimir}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-xl transition shadow-sm text-sm"
          >
            <Printer className="w-4 h-4" />
            Imprimir Recibo
          </button>
          <button
            onClick={handleNuevoPago}
            className="px-5 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition text-sm"
          >
            Nuevo Pago
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {resultado?.error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700">{resultado.error}</p>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-7 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Buscar Socio</h2>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
              placeholder="Nombre o DNI del socio..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-sm text-slate-900 placeholder-slate-400"
            />
          </div>
          <button
            onClick={handleBuscar}
            disabled={buscando}
            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-medium rounded-xl transition text-sm shadow-sm"
          >
            {buscando ? "Buscando..." : "Buscar"}
          </button>
        </div>

        {/* Search results */}
        {resultados.length > 0 && (
          <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden">
            {resultados.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSeleccionarSocio(s)}
                className="w-full text-left px-4 py-3 hover:bg-sky-50 transition border-b border-slate-100 last:border-b-0 text-sm"
              >
                <span className="font-medium text-slate-800">{s.nombre_completo}</span>
                <span className="text-slate-400 ml-2">DNI: {s.dni}</span>
                <span className="text-slate-400 ml-2">{s.zona} · Mz {s.manzana} Lt {s.lote}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected socio + pending periods */}
      {socioSeleccionado && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-7 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">{socioSeleccionado.nombre_completo}</h2>
                <p className="text-sm text-slate-500">DNI: {socioSeleccionado.dni} · {socioSeleccionado.zona} · Mz {socioSeleccionado.manzana} Lt {socioSeleccionado.lote} Com {socioSeleccionado.comite}</p>
              </div>
              <button onClick={handleNuevoPago} className="text-sm text-slate-500 hover:text-slate-700 transition">
                Cambiar socio
              </button>
            </div>

            {periodosPendientes.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                Este socio no tiene periodos pendientes de pago.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-slate-700">
                    Periodos pendientes ({periodosPendientes.length})
                  </p>
                  <button
                    onClick={seleccionarTodos}
                    className="text-xs text-sky-500 hover:text-sky-600 font-medium transition"
                  >
                    {seleccionados.size === periodosPendientes.length ? "Deseleccionar todos" : "Seleccionar todos"}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-6">
                  {periodosPendientes.map((p) => {
                    const key = `${p.anio}-${p.mes}`;
                    const selected = seleccionados.has(key);
                    return (
                      <button
                        key={key}
                        onClick={() => togglePeriodo(key)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium transition border ${
                          selected
                            ? "bg-sky-500 text-white border-sky-500 shadow-sm"
                            : "bg-white text-slate-700 border-slate-200 hover:border-sky-300 hover:bg-sky-50"
                        }`}
                      >
                        {MESES[p.mes]} {p.anio}
                      </button>
                    );
                  })}
                </div>

                {/* Payment method + confirm */}
                <div className="flex flex-col sm:flex-row gap-4 items-end border-t border-slate-100 pt-5">
                  <div className="flex-1">
                    <label htmlFor="metodo" className="block text-sm font-medium text-slate-700 mb-1.5">
                      Método de Pago
                    </label>
                    <select
                      id="metodo"
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-sm text-slate-900"
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="yape">Yape</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-slate-500 mb-1">
                      Total: <span className="text-lg font-bold text-sky-600">S/ {(seleccionados.size * 5).toFixed(2)}</span>
                    </p>
                    <button
                      onClick={handleRegistrarPago}
                      disabled={loading || seleccionados.size === 0}
                      className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 hover:shadow-lg hover:shadow-sky-200 disabled:bg-sky-300 text-white font-semibold rounded-xl transition-all text-sm shadow-md shadow-sky-100"
                    >
                      {loading ? "Registrando..." : "Confirmar Pago"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
