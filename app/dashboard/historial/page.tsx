import { ClipboardList } from "lucide-react";
import { obtenerHistorial } from "./actions";
import HistorialClient from "./historial-client";

export default async function HistorialPage() {
  const registros = await obtenerHistorial();

  return (
    <div className="p-10">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-1">
          <ClipboardList className="w-6 h-6 text-sky-500" />
          <h1 className="text-2xl font-bold text-slate-800">Historial de Auditoría</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Registro completo de todas las acciones del sistema
        </p>
      </div>
      <HistorialClient registrosIniciales={registros} />
    </div>
  );
}
