import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = ["/", "/login", "/pagar", "/acceso-denegado"];

// Mapa de permisos por rol — rutas permitidas para cada rol
const ROLE_ROUTES: Record<string, string[]> = {
  tecnico: ["/dashboard", "/dashboard/socios"],
  cobrador: [
    "/dashboard",
    "/dashboard/pagos",
    "/dashboard/cementerio/ventas",
    "/dashboard/alquileres/reservas",
  ],
  administrador: ["*"], // acceso total
};

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

function isRouteAllowed(pathname: string, rol: string): boolean {
  const allowed = ROLE_ROUTES[rol];
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

  // Si no hay sesión → login
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Obtener rol del usuario desde profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();

  const rol = profile?.rol ?? "tecnico";

  // Verificar permisos de rol para rutas del dashboard
  if (pathname.startsWith("/dashboard") && !isRouteAllowed(pathname, rol)) {
    return NextResponse.redirect(new URL("/acceso-denegado", request.url));
  }

  return supabaseResponse;
}
