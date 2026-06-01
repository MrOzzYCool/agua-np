import { UserCheck } from "lucide-react";
import Link from "next/link";

export default function AsociadosDashboardPage() {
  return (
    <div className="p-10">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-slate-800">
          Inscripción de <span className="text-violet-500">Asociados</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Asociación AAHH Nicolás de Piérola
        </p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-4">
          <UserCheck className="w-6 h-6 text-violet-500" />
          <h2 className="text-lg font-semibold text-slate-800">
            Bienvenido al módulo de <span className="text-violet-500">Asociados</span>
          </h2>
        </div>
        <p className="text-slate-500 text-sm leading-relaxed">
          Desde aquí puede registrar e inscribir a los asociados de la Asociación AAHH Nicolás de Piérola,
          asignar su número de asociado y mantener el padrón actualizado.
        </p>
      </div>
      <Link href="/asociados/dashboard/registro"
        className="inline-flex items-center gap-2 px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-xl transition shadow-md shadow-violet-100 text-sm">
        <UserCheck className="w-4 h-4" />
        Ir al Registro de Asociados
      </Link>
    </div>
  );
}
