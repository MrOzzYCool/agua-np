"use client";

import { useState } from "react";
import { Shield, ShieldOff } from "lucide-react";
import { cambiarRol, cambiarEstadoUsuario, type UsuarioView } from "./actions";

const ROLES = ["tecnico", "cobrador", "administrador"];
const ROL_COLORS: Record<string, string> = {
  tecnico: "bg-sky-100 text-sky-700",
  cobrador: "bg-amber-100 text-amber-700",
  administrador: "bg-violet-100 text-violet-700",
};

type Props = { usuarios: UsuarioView[]; currentUserId: string };

export default function UsuariosClient({ usuarios, currentUserId }: Props) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCambiarRol(userId: string, nuevoRol: string) {
    setLoading(userId); setError(""); setSuccess("");
    const res = await cambiarRol(userId, nuevoRol);
    if (res.error) setError(res.error);
    else setSuccess("Rol actualizado correctamente.");
    setLoading(null);
  }

  async function handleToggleEstado(userId: string, estadoActual: string) {
    const nuevoEstado = estadoActual === "activo" ? "inactivo" : "activo";
    setLoading(userId); setError(""); setSuccess("");
    const res = await cambiarEstadoUsuario(userId, nuevoEstado);
    if (res.error) setError(res.error);
    else setSuccess(`Usuario ${nuevoEstado === "activo" ? "activado" : "desactivado"}.`);
    setLoading(null);
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-sky-50/70 border-b border-sky-100">
                <th className="px-4 py-3 font-semibold text-sky-700 text-left">Nombre</th>
                <th className="px-4 py-3 font-semibold text-sky-700 text-left">Rol</th>
                <th className="px-4 py-3 font-semibold text-sky-700 text-left">Estado</th>
                <th className="px-4 py-3 font-semibold text-sky-700 text-left">Creado</th>
                <th className="px-4 py-3 font-semibold text-sky-700 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u) => {
                const esMismo = u.id === currentUserId;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3 text-slate-800 font-medium whitespace-nowrap">
                      {u.nombre_completo}
                      {esMismo && <span className="ml-2 text-[10px] text-sky-500 font-normal">(tú)</span>}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.rol}
                        disabled={esMismo || loading === u.id}
                        onChange={(e) => handleCambiarRol(u.id, e.target.value)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold border-0 cursor-pointer ${ROL_COLORS[u.rol] ?? "bg-slate-100 text-slate-600"} disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {ROLES.map((r) => <option key={r} value={r} className="text-slate-800">{r}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        u.estado === "activo" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                      }`}>{u.estado}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!esMismo && (
                        <button
                          onClick={() => handleToggleEstado(u.id, u.estado)}
                          disabled={loading === u.id}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-lg transition ${
                            u.estado === "activo"
                              ? "text-red-600 bg-red-50 hover:bg-red-100"
                              : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                          } disabled:opacity-50`}
                        >
                          {u.estado === "activo" ? <><ShieldOff className="w-3 h-3" /> Desactivar</> : <><Shield className="w-3 h-3" /> Activar</>}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
