import { BarChart3 } from "lucide-react";
import { obtenerEstadisticas, obtenerRecaudacionMensual } from "./actions";
import ReportesClient from "./reportes-client";

export default async function ReportesPage() {
  const stats = await obtenerEstadisticas();
  const anioActual = new Date().getFullYear();
  const recaudacion = await obtenerRecaudacionMensual(anioActual);

  return (
    <div className="p-10">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="w-6 h-6 text-sky-500" />
          <h1 className="text-2xl font-bold text-slate-800">Reportes</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">Estadísticas y recaudación del servicio de agua</p>
      </div>
      <ReportesClient stats={stats} recaudacionInicial={recaudacion} anioInicial={anioActual} />
    </div>
  );
}
