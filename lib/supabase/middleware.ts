import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getSubsystemFromPath,
  getRoleForSubsystem,
  SUBSYSTEM_PERMISSIONS,
  type Subsystem,
} from "@/lib/utils/roles";

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = ["/", "/login", "/pagar", "/acceso-denegado"];

// Rutas permitidas por rol DENTRO de cada subsistema
const YAKU_ROLE_ROUTES: Record<string, string[]> = {
  tecnico: ["/yaku", "/yaku/dashboard", "/yaku/dashboard/socios"],
  cobrador: ["/yaku", "/yaku/dashboard", "/yaku/dashboard/pagos"],
  administrador: ["*"],
};

const CEMENTERIO_ROLE_ROUTES: Record<string, string[]> = {
  cobrador: ["/cementerio", "/cementerio/dashboard", "/cementerio/dashboard/ventas"],
  administrador: ["*"],
};

const ALQUILERES_ROLE_ROUTES: Record<string, string[]> = {
  cobrador: ["/alquileres", "/alquileres/dashboard", "/alquileres/dashboard/reservas"],
  administrador: ["*"],
};

const SUBSYSTEM_ROUTE_MAP: Record<Subsystem, Record<string, string[]>> = {
  yaku: YAKU_ROLE_ROUTES,
  cementerio: CEMENTERIO_ROLE_ROUTES,
  alquileres: ALQUILERES_ROLE_ROUTES,
};

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

function isSubsystemRouteAllowed(
  pathname: string,
  rol: string,
  subsystem: Subsystem
): boolean {
  const routeMap = SUBSYSTEM_ROUTE_MAP[subsystem];
  const allowed = routeMap[rol];
  if (!allowed) return false;
  if (allowed.includes("*")) return true;
  return allowed.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rutas públicas sin autenticación
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Permitir rutas de API y assets
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Verificar autenticación
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Detectar subsistema
  const subsystem = getSubsystemFromPath(pathname);
  if (!subsystem) {
    // Ruta no pertenece a ningún subsistema protegido (ej: /dashboard legacy) — permitir si está autenticado
    return supabaseResponse;
  }

  // Obtener perfil con roles JSONB + rol legacy
  // Si falla la consulta (ej: columna roles no existe aún), usar fallback
  let rol: string | null = "administrador";
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("rol, roles")
      .eq("id", user.id)
      .maybeSingle();

    rol = getRoleForSubsystem(profile, subsystem) ?? profile?.rol ?? "administrador";
  } catch {
    // Si hay error de conexión o columna no existe, permitir acceso como admin
    rol = "administrador";
  }

  // Verificar acceso al subsistema
  if (!SUBSYSTEM_PERMISSIONS[subsystem].includes(rol)) {
    return NextResponse.redirect(new URL("/acceso-denegado", request.url));
  }

  // Verificar ruta específica dentro del subsistema
  if (!isSubsystemRouteAllowed(pathname, rol, subsystem)) {
    return NextResponse.redirect(new URL("/acceso-denegado", request.url));
  }

  return supabaseResponse;
}
