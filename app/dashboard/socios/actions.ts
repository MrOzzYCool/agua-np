"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type SocioFormState = {
  error?: string;
  success?: boolean;
};

export async function crearSocio(
  _prevState: SocioFormState,
  formData: FormData
): Promise<SocioFormState> {
  const nombres = (formData.get("nombres") as string)?.trim().toUpperCase();
  const apellidos = (formData.get("apellidos") as string)?.trim().toUpperCase();
  const dni = (formData.get("dni") as string)?.trim();
  const celular = (formData.get("celular") as string)?.trim();
  const zona = (formData.get("zona") as string)?.trim().toUpperCase();
  const manzana = (formData.get("manzana") as string)?.trim().toUpperCase();
  const lote = (formData.get("lote") as string)?.trim().toUpperCase();
  const comite = (formData.get("comite") as string)?.trim().toUpperCase();
  const fecha_inicio = formData.get("fecha_inicio") as string;

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
  if (!fecha_inicio) return { error: "La fecha de inicio es obligatoria." };

  const supabase = await createClient();

  // Usar getSession en vez de getUser para evitar consultar auth.users
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  const nombre_completo = `${apellidos} ${nombres}`;
  const direccion = `${zona} - MZ ${manzana} - LOTE ${lote} - COMITÉ ${comite}`;

  // Insertar en tabla public.socios — NO en auth.users
  const { data: socio, error } = await supabase
    .from("socios")
    .insert({
      nombres,
      apellidos,
      nombre_completo,
      dni,
      celular: celular || null,
      zona,
      manzana,
      lote,
      comite,
      direccion,
      fecha_inicio,
      estado: "activo",
      registrado_por: userId,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "El DNI ingresado ya se encuentra registrado." };
    }
    return { error: `Error al registrar: ${error.message}` };
  }

  // Auditoría en public.historial_auditoria (no bloquea si falla)
  try {
    const userEmail = user?.email ?? "Sistema";
    await supabase.from("historial_auditoria").insert({
      tipo_accion: "registro_socio",
      usuario_id: userId,
      usuario_nombre: userEmail,
      entidad_tipo: "socio",
      entidad_id: socio.id,
      observaciones: `Socio registrado: ${apellidos} ${nombres} — DNI: ${dni}`,
      estado_resultante: "activo",
    });
  } catch {
    // No bloquear el registro
  }

  revalidatePath("/dashboard/socios");
  return { success: true };
}
