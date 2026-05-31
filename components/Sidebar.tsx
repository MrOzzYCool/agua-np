"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  AlertTriangle,
  BarChart3,
  ClipboardList,
  UserCog,
  LogOut,
  Droplets,
  Landmark,
  MapPin,
  FileText,
  Building2,
  Settings,
  CalendarDays,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: string[];
};

type NavCategory = {
  label: string;
  icon: typeof LayoutDashboard;
  items: NavItem[];
};

const ALL_ROLES = ["tecnico", "cobrador", "administrador"];

const navCategories: NavCategory[] = [
  {
    label: "Agua",
    icon: Droplets,
    items: [
      { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, roles: ALL_ROLES },
      { href: "/dashboard/socios", label: "Socios", icon: Users, roles: ["tecnico", "administrador"] },
      { href: "/dashboard/pagos", label: "Pagos", icon: CreditCard, roles: ["cobrador", "administrador"] },
      { href: "/dashboard/morosidad", label: "Morosos", icon: AlertTriangle, roles: ["administrador"] },
      { href: "/dashboard/reportes", label: "Reportes", icon: BarChart3, roles: ["administrador"] },
      { href: "/dashboard/historial", label: "Historial", icon: ClipboardList, roles: ["administrador"] },
      { href: "/dashboard/usuarios", label: "Usuarios", icon: UserCog, roles: ["administrador"] },
    ],
  },
  {
    label: "Cementerio",
    icon: Landmark,
    items: [
      { href: "/dashboard/cementerio/parcelas", label: "Parcelas", icon: MapPin, roles: ["administrador"] },
      { href: "/dashboard/cementerio/ventas", label: "Ventas", icon: FileText, roles: ["cobrador", "administrador"] },
    ],
  },
  {
    label: "Alquileres",
    icon: Building2,
    items: [
      { href: "/dashboard/alquileres/instalaciones", label: "Instalaciones", icon: Settings, roles: ["administrador"] },
      { href: "/dashboard/alquileres/reservas", label: "Reservas", icon: CalendarDays, roles: ["cobrador", "administrador"] },
    ],
  },
];

type Props = { rol: string; nombreUsuario: string };

export default function Sidebar({ rol, nombreUsuario }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Filtrar categorías: solo mostrar las que tengan al menos un ítem visible para el rol
  const visibleCategories = navCategories
    .map((cat) => ({
      ...cat,
      items: cat.items.filter((item) => item.roles.includes(rol)),
    }))
    .filter((cat) => cat.items.length > 0);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  // Determinar si una categoría tiene algún ítem activo
  function isCategoryActive(cat: NavCategory): boolean {
    return cat.items.some(
      (item) =>
        pathname === item.href ||
        (item.href !== "/dashboard" && pathname.startsWith(item.href))
    );
  }

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col min-h-screen shadow-xl">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/30">
            <Droplets className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">YAKU</h1>
            <p className="text-[11px] text-slate-400 leading-tight">Portal Integral</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">
        {visibleCategories.map((cat) => {
          const CatIcon = cat.icon;
          const catActive = isCategoryActive(cat);
          return (
            <div key={cat.label}>
              {/* Category header */}
              <div className="flex items-center gap-2 px-3 mb-2">
                <CatIcon
                  className={`w-4 h-4 ${catActive ? "text-sky-400" : "text-slate-600"}`}
                />
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                    catActive ? "text-sky-400" : "text-slate-600"
                  }`}
                >
                  {cat.label}
                </span>
              </div>
              {/* Category items */}
              <div className="space-y-1">
                {cat.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                        isActive
                          ? "bg-sky-500/15 text-sky-400"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <Icon className={`w-4.5 h-4.5 ${isActive ? "text-sky-400" : "text-slate-500"}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User info + Sign out */}
      <div className="px-4 py-5 border-t border-slate-700/50">
        <p className="text-xs text-slate-500 mb-1 px-4 truncate">{nombreUsuario}</p>
        <p className="text-[10px] text-slate-600 mb-3 px-4 capitalize">{rol}</p>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/15 hover:text-red-400 transition w-full"
        >
          <LogOut className="w-5 h-5" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}