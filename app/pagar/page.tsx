"use client";

import { useState } from "react";
import { Droplets, Search, CheckCircle, Upload, AlertCircle } from "lucide-react";
import {
  buscarSocioPorDni,
  type SocioPublico,
  type PeriodoMensual,
} from "./actions";
import VoucherUploader, { type VoucherFile } from "@/components/VoucherUploader";

const MESES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function PagarPage() {
  const [dni, setDni] = useState("");
  const [socio, setSocio] = useState<SocioPublico | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [voucherFiles, setVoucherFiles] = useState<VoucherFile[]>([]);
  const [enviado, setEnviado] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function handleBuscar() {
    if (!/^\d{8}$/.test(dni)) { setError("Ingrese un DNI válido de 8 dígitos."); return; }
    setLoading(true); setError(""); setSocio(null); setSeleccionados(new Set());
    const res = await buscarSocioPorDni(dni);
    if (res.error) setError(res.error);
    else if (res.socio) setSocio(res.socio);
    setLoading(false);
  }

  function togglePeriodo(key: string) {
    setSeleccionados((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }

  function seleccionarTodos() {
    if (!socio) return;
    if (seleccionados.size === socio.periodosPendientes.length) setSeleccionados(new Set());
    else setSeleccionados(new Set(socio.periodosPendientes.map((p) => `${p.anio}-${p.mes}`)));
  }

  function seleccionarAnio(anio: number) {
    if (!socio) return;
    const del_anio = socio.periodosPendientes.filter((p) => p.anio === anio).map((p) => `${p.anio}-${p.mes}`);
    const allSelected = del_anio.every((k) => seleccionados.has(k));
    setSeleccionados((prev) => {
      const n = new Set(prev);
      del_anio.forEach((k) => allSelected ? n.delete(k) : n.add(k));
      return n;
    });
  }

  async function handleEnviar() {
    if (!socio || seleccionados.size === 0) return;

    // Recolectar URLs de archivos ya subidos
    const urls = voucherFiles.filter((f) => f.publicUrl).map((f) => f.publicUrl!);
    if (urls.length === 0) { setError("Debe subir al menos un comprobante antes de enviar."); return; }

    setLoading(true); setError("");

    const periodos = Array.from(seleccionados).map((k) => {
      const [anio, mes] = k.split("-").map(Number);
      return { anio, mes };
    });

    // Llamar al API endpoint (usa SERVICE_ROLE_KEY en el servidor)
    try {
      const res = await fetch("/api/pagos/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socio_id: socio.id, periodos, voucher_urls: urls }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? "Error al registrar el pago.");
        setLoading(false);
        return;
      }

      setEnviado(true);
      setMensaje(data.mensaje ?? "Pago registrado correctamente.");
    } catch {
      setError("Error de conexión. Intente nuevamente.");
    }
    setLoading(false);
  }

  // Años únicos de los periodos pendientes
  const aniosUnicos = socio ? [...new Set(socio.periodosPendientes.map((p) => p.anio))].sort() : [];
  const montoTotal = seleccionados.size * (socio?.tarifa ?? 4);

  // --- PANTALLA DE CONFIRMACIÓN ---
  if (enviado) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Pago Enviado</h2>
          <p className="text-slate-500 text-sm mb-6">{mensaje}</p>
          <button onClick={() => { setEnviado(false); setSocio(null); setDni(""); setSeleccionados(new Set()); setVoucherFiles([]); }}
            className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-xl transition text-sm">
            Realizar otro pago
          </button>
        </div>
      </div>
    );
  }

  // --- FORMULARIO PRINCIPAL ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-sky-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sky-500">YAKU</h1>
            <p className="text-[11px] text-slate-400">Pago de Servicio de Agua</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Error global */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* PASO 1: Buscar por DNI */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Ingrese su DNI</h2>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={dni} maxLength={8}
                onChange={(e) => { setDni(e.target.value.replace(/\D/g, "")); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                placeholder="Ingrese 8 dígitos"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-sm font-mono text-slate-900 placeholder-slate-400" />
            </div>
            <button onClick={handleBuscar} disabled={loading}
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-medium rounded-xl transition text-sm shadow-sm">
              {loading && !socio ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </div>

        {/* PASO 2: Info del socio + selección de periodos */}
        {socio && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            {/* Datos del socio */}
            <div className="mb-5 pb-5 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-800">{socio.nombre_completo}</h2>
              <p className="text-sm text-slate-500">{socio.zona} — Mz {socio.manzana} Lt {socio.lote} Com {socio.comite}</p>
              <p className="text-sm font-semibold text-red-500 mt-2">
                Deuda total: S/ {socio.deudaTotal.toFixed(2)} ({socio.periodosPendientes.length} meses)
              </p>
            </div>

            {socio.periodosPendientes.length === 0 ? (
              <p className="text-center py-6 text-emerald-600 text-sm font-medium">No tiene deuda pendiente.</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-slate-700">
                    Seleccione periodos a pagar
                    {seleccionados.size > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full text-[10px] font-semibold">
                        {seleccionados.size} seleccionado(s)
                      </span>
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={seleccionarTodos}
                    disabled={socio.periodosPendientes.length === 0}
                    aria-pressed={seleccionados.size === socio.periodosPendientes.length && socio.periodosPendientes.length > 0}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                      seleccionados.size === socio.periodosPendientes.length && socio.periodosPendientes.length > 0
                        ? "bg-sky-500 text-white hover:bg-sky-600 shadow-sm"
                        : "bg-white text-sky-600 border border-sky-300 hover:bg-sky-50"
                    }`}
                  >
                    {seleccionados.size === socio.periodosPendientes.length && socio.periodosPendientes.length > 0
                      ? "Deseleccionar todos"
                      : "Seleccionar todos"}
                  </button>
                </div>

                {/* Botones de año completo */}
                {aniosUnicos.length > 1 && (
                  <div className="flex gap-2 mb-3">
                    {aniosUnicos.map((anio) => (
                      <button key={anio} onClick={() => seleccionarAnio(anio)}
                        className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-sky-50 hover:border-sky-300 transition text-slate-600">
                        Año {anio}
                      </button>
                    ))}
                  </div>
                )}

                {/* Grid de periodos */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-5">
                  {socio.periodosPendientes.map((p) => {
                    const key = `${p.anio}-${p.mes}`;
                    const sel = seleccionados.has(key);
                    return (
                      <button key={key} onClick={() => togglePeriodo(key)}
                        className={`px-2 py-2 rounded-xl text-xs font-medium transition-all duration-150 border ${
                          sel ? "bg-sky-500 text-white border-sky-500 shadow-sm scale-[1.02]" : "bg-white text-slate-600 border-slate-200 hover:border-sky-300"
                        }`}>
                        {MESES[p.mes].slice(0, 3)} {p.anio}
                      </button>
                    );
                  })}
                </div>

                {/* Monto total */}
                {seleccionados.size > 0 && (
                  <div className="text-right mb-4">
                    <p className="text-sm text-slate-500">
                      {seleccionados.size} periodo(s) × S/ {socio.tarifa.toFixed(2)} =
                      <span className="text-lg font-bold text-sky-600 ml-1">S/ {montoTotal.toFixed(2)}</span>
                    </p>
                  </div>
                )}

                {/* PASO 3: Vouchers + enviar */}
                {seleccionados.size > 0 && (
                  <div className="border-t border-slate-100 pt-5">
                    <VoucherUploader onStateChange={setVoucherFiles} socioId={socio.id} />

                    <button onClick={handleEnviar}
                      disabled={loading || voucherFiles.filter((f) => f.publicUrl).length === 0}
                      className="mt-4 w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-semibold rounded-xl transition shadow-md shadow-emerald-100 text-sm">
                      {loading ? "Registrando pago..." : `Enviar pago — S/ ${montoTotal.toFixed(2)} (Confirmar y registrar)`}
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-2">
                      Al presionar se registrará el pago como pendiente de aprobación
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-400">
          YAKU — Sistema Integral de Agua · Asociación AAHH Nicolás de Piérola
        </p>
      </div>
    </div>
  );
}
