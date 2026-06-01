"use client";

import { useActionState, useRef, useEffect } from "react";
import { crearAsociado, type AsociadoFormState } from "./actions";
import DatePicker from "@/components/date-picker";

const initialState: AsociadoFormState = {};
const inputCls = "w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition text-slate-900 text-sm placeholder-slate-400";

function formatMzLtCom(value: string): string {
  const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length < 2) return clean;
  let result = clean[0];
  for (let i = 1; i < clean.length; i++) {
    const prevIsLetter = /[A-Z]/.test(clean[i - 1]);
    const currIsLetter = /[A-Z]/.test(clean[i]);
    if (prevIsLetter !== currIsLetter) result += "-";
    result += clean[i];
  }
  return result;
}

function handleMzChange(e: React.ChangeEvent<HTMLInputElement>) {
  e.target.value = formatMzLtCom(e.target.value);
}

export default function AsociadoForm() {
  const [state, formAction, pending] = useActionState(crearAsociado, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      {state.error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}
      {state.success && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-sm text-emerald-700">Asociado registrado correctamente.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Número de asociado — campo especial */}
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            N° de Asociado
            <span className="ml-2 text-[10px] text-slate-400 font-normal">(Ingrese manualmente — se asignará correlativo en el futuro)</span>
          </label>
          <input name="numero_asociado"
            className={`${inputCls} max-w-xs font-mono`} placeholder="Ej: 001, 125..." />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombres</label>
          <input name="nombres" required onChange={(e) => { e.target.value = e.target.value.toUpperCase(); }}
            className={`${inputCls} uppercase`} placeholder="JUAN CARLOS" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Apellidos</label>
          <input name="apellidos" required onChange={(e) => { e.target.value = e.target.value.toUpperCase(); }}
            className={`${inputCls} uppercase`} placeholder="PÉREZ LÓPEZ" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">DNI</label>
          <input name="dni" required maxLength={8} pattern="\d{8}"
            onChange={(e) => { e.target.value = e.target.value.replace(/\D/g, ""); }}
            className={`${inputCls} font-mono`} placeholder="12345678" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Celular</label>
          <input name="celular" maxLength={9} pattern="\d{9}"
            onChange={(e) => { e.target.value = e.target.value.replace(/\D/g, ""); }}
            className={`${inputCls} font-mono`} placeholder="987654321" />
          <p className="text-[10px] text-slate-400 mt-1">Opcional — 9 dígitos</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Zona</label>
          <select name="zona" required className={inputCls}>
            <option value="">Seleccionar...</option>
            <option value="1RA ZONA">1RA ZONA</option>
            <option value="2DA ZONA">2DA ZONA</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Manzana</label>
          <input name="manzana" required onChange={handleMzChange}
            className={`${inputCls} uppercase`} placeholder="D-2" />
          <p className="text-[10px] text-slate-400 mt-1">Ej: D-2, 93, A-1</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Lote</label>
          <input name="lote" required onChange={handleMzChange}
            className={`${inputCls} uppercase`} placeholder="01" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Comité</label>
          <input name="comite" required onChange={handleMzChange}
            className={`${inputCls} uppercase`} placeholder="35" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha de Inscripción</label>
          <DatePicker name="fecha_inscripcion" defaultValue={new Date().toISOString().split("T")[0]} required />
        </div>
      </div>

      <button type="submit" disabled={pending}
        className="w-full sm:w-auto px-6 py-2.5 bg-violet-500 hover:bg-violet-600 hover:shadow-lg hover:shadow-violet-200 disabled:bg-violet-300 text-white font-semibold rounded-xl transition-all text-sm shadow-md shadow-violet-100">
        {pending ? "Registrando..." : "Registrar Asociado"}
      </button>
    </form>
  );
}
