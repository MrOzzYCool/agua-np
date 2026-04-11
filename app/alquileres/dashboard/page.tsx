import { Building2 } from "lucide-react";

export default function AlquileresDashboardPage() {
  return (
    <div className="p-10">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-slate-800">
          Panel de Control <span className="text-emerald-500">Alquileres</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Asociación AAHH Nicolás de Piérola
        </p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-6 h-6 text-emerald-500" />
          <h2 className="text-lg font-semibold text-slate-800">
            Bienvenido al módulo de <span className="text-emerald-500">Alquileres</span>
          </h2>
        </div>
        <p className="text-slate-500 text-sm leading-relaxed">
          Desde aquí puede gestionar las instalaciones comunitarias (Estadio y Losa Deportiva),
          registrar reservas y administrar los cobros de alquiler.
          Use el menú lateral para navegar entre los módulos.
        </p>
      </div>
    </div>
  );
}
