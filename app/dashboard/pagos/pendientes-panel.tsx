"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Eye, FileText, X } from "lucide-react";
import { aprobarPago, rechazarPago, obtenerSignedUrls, type PagoPendienteView } from "./actions";
import { formatPeriodos } from "@/lib/utils/format-periodos";

const MESES = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function parseVoucherUrls(raw: string | null): string[] {
  if (!raw) return [];
  try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed; } catch {}
  if (raw.includes(",")) return raw.split(",").map((u) => u.trim()).filter(Boolean);
  return [raw];
}

function isImage(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);
}

export default function PendientesPanel({ pagos }: { pagos: PagoPendienteView[] }) {
  const [accionId, setAccionId] = useState<string | null>(null);
  const [accionTipo, setAccionTipo] = useState<"aprobar" | "rechazar" | null>(null);
  const [obs, setObs] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [procesados, setProcesados] = useState<Set<string>>(new Set());

  async function handleAccion() {
    if (!accionId || !accionTipo) return;
    if (!obs.trim()) { setError("Las observaciones son obligatorias."); return; }
    setLoading(true); setError("");

    const res = accionTipo === "aprobar"
      ? await aprobarPago(accionId, obs)
      : await rechazarPago(accionId, obs);

    if (res.error) { setError(res.error); setLoading(false); return; }
    setProcesados((prev) => new Set(prev).add(accionId));
    setAccionId(null); setAccionTipo(null); setObs("");
    setLoading(false);
  }

  function abrirAccion(id: string, tipo: "aprobar" | "rechazar") {
    setAccionId(id); setAccionTipo(tipo); setObs(""); setError("");
  }

  // Cargar signed URLs para cada pago
  const [signedUrlsMap, setSignedUrlsMap] = useState<Record<string, string[]>>({});

  useEffect(() => {
    async function loadUrls() {
      const map: Record<string, string[]> = {};
      for (const p of pagos) {
        if (p.voucher_url && !procesados.has(p.id)) {
          const urls = await obtenerSignedUrls(p.voucher_url);
          map[p.id] = urls;
        }
      }
      setSignedUrlsMap(map);
    }
    loadUrls();
  }, [pagos, procesados]);

  // Estado para modal de voucher
  const [modalUrl, setModalUrl] = useState<string | null>(null);

  const visibles = pagos.filter((p) => !procesados.has(p.id));

  if (visibles.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm text-center">
        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">No hay pagos pendientes de aprobación.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Modal de voucher */}
      {modalUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModalUrl(null)}>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-800">Comprobante de pago</span>
              <div className="flex items-center gap-3">
                <a href={modalUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-sky-600 hover:text-sky-700 hover:underline font-medium transition">
                  Abrir en nueva pestaña ↗
                </a>
                <button onClick={() => setModalUrl(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-50 max-h-[80vh] overflow-auto">
              {modalUrl.toLowerCase().endsWith(".pdf") ? (
                <iframe src={modalUrl} className="w-full h-[70vh] rounded-lg" />
              ) : (
                <img src={modalUrl} alt="Voucher" className="max-w-full max-h-[70vh] rounded-xl shadow-md object-contain" />
              )}
            </div>
          </div>
        </div>
      )}

      {visibles.map((p) => (
        <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex-1">
              <p className="font-semibold text-slate-800">{p.socio_nombre}</p>
              <p className="text-xs text-slate-500">
                DNI: {p.socio_dni} · {formatPeriodos(p.periodos)} · S/ {p.monto_total.toFixed(2)}
                <span className="text-slate-400 ml-1">({p.periodos.length} mes{p.periodos.length > 1 ? "es" : ""})</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-1" suppressHydrationWarning>
                Enviado: {new Date(p.created_at).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => abrirAccion(p.id, "aprobar")}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition">
                <CheckCircle className="w-3.5 h-3.5" /> Aprobar
              </button>
              <button onClick={() => abrirAccion(p.id, "rechazar")}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition">
                <XCircle className="w-3.5 h-3.5" /> Rechazar
              </button>
            </div>
          </div>

          {/* Vouchers como enlaces con signed URLs */}
          {(() => {
            const urls = signedUrlsMap[p.id] ?? [];
            if (urls.length === 0 && !p.voucher_url) return (
              <p className="text-[10px] text-slate-400 mt-3">Sin comprobantes adjuntos</p>
            );
            if (urls.length === 0) return (
              <p className="text-[10px] text-slate-400 mt-3">Cargando comprobantes...</p>
            );
            return (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400">Comprobantes:</span>
                  {urls.map((url, vi) => (
                    <button key={vi}
                      onClick={() => setModalUrl(url)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-sky-600 bg-sky-50 border border-sky-200 rounded-md hover:bg-sky-100 hover:text-sky-700 transition cursor-pointer">
                      <Eye className="w-2.5 h-2.5" />
                      Voucher {vi + 1}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Modal de observaciones inline */}
          {accionId === p.id && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Observaciones ({accionTipo === "aprobar" ? "aprobación" : "rechazo"})
              </label>
              <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2}
                placeholder="Escriba el motivo..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-sm text-slate-900 placeholder-slate-400 resize-none" />
              <div className="flex gap-2 mt-2">
                <button onClick={handleAccion} disabled={loading}
                  className={`px-4 py-2 text-xs font-medium rounded-lg transition text-white ${
                    accionTipo === "aprobar" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-red-500 hover:bg-red-600"
                  } disabled:opacity-50`}>
                  {loading ? "Procesando..." : accionTipo === "aprobar" ? "Confirmar Aprobación" : "Confirmar Rechazo"}
                </button>
                <button onClick={() => { setAccionId(null); setError(""); }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition">
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
