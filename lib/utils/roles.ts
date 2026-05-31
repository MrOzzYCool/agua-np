/**
 * Obtiene el rol de un usuario para un subsistema específico.
 * Prioriza roles JSONB por subsistema, fallback al campo rol global.
 */
export function getRoleForSubsystem(
  profile: { rol?: string; roles?: Record<string, string> } | null,
  subsystem: string
): string | null {
  if (!profile) return null;
  if (profile.roles && profile.roles[subsystem]) return profile.roles[subsystem];
  return profile.rol ?? null;
}

export type Subsystem = "yaku" | "cementerio" | "alquileres";

export function getSubsystemFromPath(pathname: string): Subsystem | null {
  if (pathname.startsWith("/yaku")) return "yaku";
  if (pathname.startsWith("/cementerio")) return "cementerio";
  if (pathname.startsWith("/alquileres")) return "alquileres";
  return null;
}

/** Permisos: qué roles pueden acceder a cada subsistema */
export const SUBSYSTEM_PERMISSIONS: Record<Subsystem, string[]> = {
  yaku: ["administrador", "tecnico", "cobrador"],
  cementerio: ["administrador", "cobrador"],
  alquileres: ["administrador", "cobrador"],
};
