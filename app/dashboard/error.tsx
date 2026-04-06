"use client";

import { AlertCircle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-10">
      <div className="bg-white rounded-xl border border-red-200 p-8 shadow-sm max-w-lg mx-auto text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Error al cargar</h2>
        <p className="text-sm text-slate-500 mb-1">Ocurrió un error al cargar esta página.</p>
        <p className="text-xs text-red-400 mb-4 font-mono break-all">{error.message}</p>
        <button onClick={reset}
          className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-xl transition text-sm">
          Reintentar
        </button>
      </div>
    </div>
  );
}
