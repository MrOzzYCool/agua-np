import { UserCog } from "lucide-react";
import { obtenerUsuarios, obtenerUsuarioActual } from "./actions";
import UsuariosClient from "./usuarios-client";

export default async function UsuariosPage() {
  const usuarios = await obtenerUsuarios();
  const currentUserId = await obtenerUsuarioActual();

  return (
    <div className="p-10">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-1">
          <UserCog className="w-6 h-6 text-sky-500" />
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">Administre los usuarios y roles del sistema</p>
      </div>
      <UsuariosClient usuarios={usuarios} currentUserId={currentUserId ?? ""} />
    </div>
  );
}
