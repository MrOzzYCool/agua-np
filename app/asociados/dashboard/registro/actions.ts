"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type AsociadoFormState = {
  error?: string;
  success?: boolean;
};

export async function crearAsociado(
  _prevState: AsociadoFormState,
  formData: FormData
): Promise<AsociadoFormState> {
  const numero_asociado = (formData.get("numero_asociado") as string)?.trim();
  const nombres = (formData.get("nombres") as string)?.trim().toUpperCase();
  const apellidos = (formData.get("apellidos") as string)?.trim().toUpperCase();
  const dni = (formData.get("dni") as string)?.trim();
  const celular = (formData.get("celular") as string)?.trim();
  const zona = (formData.get("zona") as string)?.trim().toUpperCase();
  const manzana = (formData.get("manzana") as string)?.trim().toUpperCase();
  const lote = (formData.get("lote") as string)?.trim().toUpperCase();
  const comite = (formData.get("comite") as string)?.trim().toUpperCase();
  const fecha_inscripcion = formData.get("fecha_inscripcion") as string;

  if (!nombres) return { error: "Los nombres son obligatorios." };
  if (!apellidos) return { error: "Los apellidos son obligatorios." };
  if (!dni || !/^\d{8}$/.test(dni))
    return { error: "El DNI debe contener exactamente 8 dígitos." };
  if (celular && !/^\d{9}$/.test(celular))
    return { error: "El celular debe contener exactamente 9 dígitos." };
  if (!zona) return { error: "La zona es obligatoria." };
  if (!manzana) return { error: "La manzana es obligatoria." };
  if (!lote) return { error: "El lote es obligatorio." };
  if (!comite) return { error: "El comité es obligatorio." };
  if (!fecha_inscripcion) return { error: "La fecha de inscripción es obligatoria." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  const { data: asociado, error } = await supabase
    .from("asociados")
    .insert({
      numero_asociado: numero_asociado || null,
      nombres,
      apellidos,
      dni,
      celular: celular || null,
      zona,
      manzana,
      lote,
      comite,
      fecha_inscripcion,
      estado: "activo",
      registrado_por: userId,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "El DNI ingresado ya se encuentra registrado como asociado." };
    }
    return { error: `Error al registrar: ${error.message}` };
  }

  revalidatePath("/asociados/dashboard/registro");
  return { success: true };
}
