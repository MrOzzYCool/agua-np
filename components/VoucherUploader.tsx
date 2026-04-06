"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, Loader2, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const MAX_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 6;
const TYPES = ["image/jpeg", "image/png", "application/pdf"];

export type VoucherFile = {
  id: string;
  file: File;
  preview: string | null;
  storagePath: string | null;
  publicUrl: string | null;
  status: "local" | "uploading" | "uploaded" | "error" | "removing";
  error: string | null;
};

type Props = {
  socioId?: string;
  onStateChange: (files: VoucherFile[]) => void;
};

let idCounter = 0;
function uid() { return `vf_${Date.now()}_${++idCounter}`; }

export default function VoucherUploader({ socioId, onStateChange }: Props) {
  const [files, setFiles] = useState<VoucherFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const update = useCallback((next: VoucherFile[]) => {
    setFiles(next);
    onStateChange(next);
  }, [onStateChange]);

  function validate(f: File): string | null {
    if (!TYPES.includes(f.type)) return `"${f.name}": solo JPG, PNG o PDF.`;
    if (f.size > MAX_SIZE) return `"${f.name}" supera los 5 MB.`;
    return null;
  }

  function addFiles(newFiles: File[]) {
    setGlobalError("");
    const remaining = MAX_FILES - files.length;
    if (remaining <= 0) { setGlobalError(`Máximo ${MAX_FILES} archivos.`); return; }
    const toAdd: VoucherFile[] = [];
    for (const f of newFiles.slice(0, remaining)) {
      const err = validate(f);
      if (err) { setGlobalError(err); continue; }
      toAdd.push({
        id: uid(), file: f,
        preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
        storagePath: null, publicUrl: null, status: "local", error: null,
      });
    }
    update([...files, ...toAdd]);
  }

  async function removeFile(index: number) {
    const item = files[index];
    if (item.preview) URL.revokeObjectURL(item.preview);

    // Si ya fue subido, eliminar del bucket
    if (item.storagePath) {
      const next = [...files];
      next[index] = { ...item, status: "removing" };
      setFiles(next);

      const { error } = await supabase.storage.from("vouchers").remove([item.storagePath]);
      if (error) {
        next[index] = { ...item, status: "error", error: "No se pudo eliminar del servidor" };
        update(next);
        return;
      }
    }

    update(files.filter((_, i) => i !== index));
  }

  async function uploadPending() {
    const next = [...files];
    for (let i = 0; i < next.length; i++) {
      if (next[i].status !== "local") continue;
      next[i] = { ...next[i], status: "uploading", error: null };
      setFiles([...next]);

      const f = next[i].file;
      const ext = f.name.split(".").pop() ?? "jpg";
      const prefix = socioId ?? "anon";
      const path = `socios/${prefix}_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}.${ext}`;

      const { error } = await supabase.storage.from("vouchers").upload(path, f, { contentType: f.type });
      if (error) {
        next[i] = { ...next[i], status: "error", error: "Error al subir" };
      } else {
        const { data } = supabase.storage.from("vouchers").getPublicUrl(path);
        next[i] = { ...next[i], status: "uploaded", storagePath: path, publicUrl: data.publicUrl };
      }
      setFiles([...next]);
    }
    update(next);
  }

  // Subir archivos pendientes y retornar URLs (llamado desde el padre antes de enviar pago)
  async function uploadAllAndGetUrls(): Promise<string[]> {
    await uploadPending();
    return files.filter((f) => f.publicUrl).map((f) => f.publicUrl!);
  }

  // Exponer método para el padre
  if (typeof window !== "undefined") {
    window.__yakuVoucherUpload = uploadAllAndGetUrls;
  }

  const pendingCount = files.filter((f) => f.status === "local").length;
  const uploadedCount = files.filter((f) => f.status === "uploaded").length;

  return (
    <div className="space-y-3">
      {globalError && (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-700">{globalError}</p>
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(Array.from(e.dataTransfer.files)); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
          dragOver ? "border-sky-400 bg-sky-50" : "border-slate-300 hover:border-sky-300 hover:bg-sky-50/50"
        }`}
        role="button" aria-label="Seleccionar comprobantes"
      >
        <Upload className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
        <p className="text-xs text-slate-600">Arrastre archivos o haga clic para seleccionar</p>
        <p className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, PDF — Máx 5 MB — Hasta {MAX_FILES}</p>
      </div>
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" multiple className="hidden"
        onChange={(e) => { addFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />

      {/* File cards */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {files.map((item, i) => (
            <div key={item.id} className="relative bg-slate-50 rounded-xl border border-slate-200 p-2 group">
              <div className="aspect-square rounded-lg overflow-hidden bg-white flex items-center justify-center mb-1.5">
                {item.preview ? (
                  <img src={item.preview} alt={item.file.name} className="w-full h-full object-cover" />
                ) : (
                  <FileText className="w-8 h-8 text-red-400" />
                )}
                {item.status === "uploading" && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl">
                    <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
                  </div>
                )}
                {item.status === "removing" && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl">
                    <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
                  </div>
                )}
                {item.status === "uploaded" && (
                  <div className="absolute top-1 right-1"><CheckCircle className="w-5 h-5 text-emerald-500 bg-white rounded-full" /></div>
                )}
                {item.status === "error" && (
                  <div className="absolute top-1 right-1"><AlertCircle className="w-5 h-5 text-red-500 bg-white rounded-full" /></div>
                )}
              </div>
              <p className="text-[10px] text-slate-600 truncate">{item.file.name}</p>
              <p className="text-[9px] text-slate-400">{(item.file.size / 1024).toFixed(0)} KB
                {item.status === "uploaded" && <span className="text-emerald-500 ml-1">✓ subido</span>}
                {item.status === "local" && <span className="text-amber-500 ml-1">pendiente</span>}
              </p>
              {item.error && <p className="text-[9px] text-red-500">{item.error}</p>}
              <button onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                disabled={item.status === "uploading" || item.status === "removing"}
                className="absolute top-1 left-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition disabled:opacity-30"
                aria-label={`Eliminar ${item.file.name}`}>
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button — solo sube a storage, NO crea pago */}
      {pendingCount > 0 && (
        <div>
          <button onClick={uploadPending} type="button"
            className="w-full py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 font-medium rounded-xl transition text-xs border border-sky-200">
            <Upload className="w-3.5 h-3.5 inline mr-1" />
            Cargar {pendingCount} comprobante(s) seleccionado(s)
          </button>
          <p className="text-[10px] text-slate-400 text-center mt-1">
            Una vez cargados, presiona el botón &quot;Enviar pago&quot; para finalizar.
          </p>
        </div>
      )}

      {uploadedCount > 0 && (
        <p className="text-[10px] text-emerald-600 text-center font-medium">
          <CheckCircle className="w-3 h-3 inline mr-0.5" />
          {uploadedCount} comprobante(s) subido(s)
        </p>
      )}

      <p className="text-[10px] text-slate-400">{files.length}/{MAX_FILES} archivos</p>
    </div>
  );
}
