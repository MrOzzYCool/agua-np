import { CreditCard } from "lucide-react";
import { obtenerPagosPendientes } from "./actions";
import PendientesPanel from "./pendientes-panel";

export default async function PagosPage() {
  let pendientes: Awaited<ReturnType<typeof obtenerPagosPendientes>> = [];
  try {
    pendientes = await obtenerPagosPendientes();
  } catch {
    // Si falla, mostrar lista vacía
  }

  return (
    <div className="p-10">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-1">
          <CreditCard className="w-6 h-6 text-sky-500" />
          <h1 className="text-2xl font-bold text-slate-800">Pagos Pendientes</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Revise y apruebe o rechace los pagos enviados por los socios
        </p>
      </div>
      <PendientesPanel pagos={pendientes} />
    </div>
  );
}
