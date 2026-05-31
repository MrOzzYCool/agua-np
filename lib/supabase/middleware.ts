import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = ["/", "/login", "/pagar", "/acceso-denegado"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
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

  // Si no hay sesión → login
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Usuario autenticado → permitir acceso a todos los subsistemas
  // La verificación granular de roles se implementará después
  return supabaseResponse;
}
