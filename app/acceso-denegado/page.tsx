import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function AccesoDenegadoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-sm">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <ShieldX className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Acceso Denegado</h1>
        <p className="text-slate-500 text-sm mb-6">
          No tiene permisos para acceder a esta sección. Contacte al administrador si cree que es un error.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-5 py-2.5 bg-sky-500 text-white font-medium rounded-xl hover:bg-sky-600 transition shadow-sm text-sm"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
