import { Landmark } from "lucide-react";

export default function CementerioDashboardPage() {
  return (
    <div className="p-10">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-slate-800">
          Panel de Control <span className="text-amber-500">Cementerio</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Asociación AAHH Nicolás de Piérola
        </p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Landmark className="w-6 h-6 text-amber-500" />
          <h2 className="text-lg font-semibold text-slate-800">
            Bienvenido al módulo de <span className="text-amber-500">Cementerio</span>
          </h2>
        </div>
        <p className="text-slate-500 text-sm leading-relaxed">
          Desde aquí puede gestionar el inventario de parcelas (nichos y mausoleos),
          registrar ventas con contratos y administrar las cuotas de pago.
          Use el menú lateral para navegar entre los módulos.
        </p>
      </div>
    </div>
  );
}
