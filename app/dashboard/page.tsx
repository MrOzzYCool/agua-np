import { Droplets } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="p-10">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-slate-800">
          Panel de Control <span className="text-sky-500">YAKU</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Asociación AAHH Nicolás de Piérola
        </p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Droplets className="w-6 h-6 text-sky-500" />
          <h2 className="text-lg font-semibold text-slate-800">
            Bienvenido a <span className="text-sky-500">YAKU</span>
          </h2>
        </div>
        <p className="text-slate-500 text-sm leading-relaxed">
          Desde aquí puede gestionar socios, registrar pagos, controlar la morosidad
          y generar reportes de recaudación del servicio de agua potable.
          Use el menú lateral para navegar entre los módulos.
        </p>
      </div>
    </div>
  );
}
