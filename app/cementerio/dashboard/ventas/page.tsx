import { FileText } from "lucide-react";

export default function VentasCementerioPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
          <FileText className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ventas de Cementerio</h1>
          <p className="text-sm text-slate-500">Contratos y cuotas de parcelas</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <p className="text-slate-400 text-sm">Módulo en construcción — próximamente disponible.</p>
      </div>
    </div>
  );
}
