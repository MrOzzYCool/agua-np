"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Droplets, Landmark, Building2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Credenciales incorrectas. Verifique su correo y contraseña.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-sky-50 to-slate-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-8">
          {/* Header — Portal Integral */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center shadow-md shadow-sky-200">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-md shadow-amber-200">
                <Landmark className="w-5 h-5 text-white" />
              </div>
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md shadow-emerald-200">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Portal Integral
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Asociación AAHH Nicolás de Piérola
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Agua · Cementerio · Alquileres
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Usuario
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-slate-900 placeholder-slate-400"
                placeholder="usuario@ejemplo.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition text-slate-900 placeholder-slate-400"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-medium rounded-xl transition focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 shadow-sm"
            >
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-6">
          Portal Integral · Asociación AAHH Nicolás de Piérola
        </p>
      </div>
    </div>
  );
}
