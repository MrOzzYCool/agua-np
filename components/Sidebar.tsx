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
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: string[]; // roles que pueden ver este ítem
};

const ALL_ROLES = ["tecnico", "cobrador", "administrador"];

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, roles: ALL_ROLES },
  { href: "/dashboard/socios", label: "Socios", icon: Users, roles: ["tecnico", "administrador"] },
  { href: "/dashboard/pagos", label: "Pagos", icon: CreditCard, roles: ["cobrador", "administrador"] },
  { href: "/dashboard/morosidad", label: "Morosos", icon: AlertTriangle, roles: ["administrador"] },
  { href: "/dashboard/reportes", label: "Reportes", icon: BarChart3, roles: ["administrador"] },
  { href: "/dashboard/historial", label: "Historial", icon: ClipboardList, roles: ["administrador"] },
  { href: "/dashboard/usuarios", label: "Usuarios", icon: UserCog, roles: ["administrador"] },
];

type Props = { rol: string; nombreUsuario: string };

export default function Sidebar({ rol, nombreUsuario }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const visibleItems = navItems.filter((item) => item.roles.includes(rol));

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
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
            <p className="text-[11px] text-slate-400 leading-tight">Sistema Integral de Agua</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                isActive
                  ? "bg-sky-500/15 text-sky-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-sky-400" : "text-slate-500"}`} />
              {item.label}
            </Link>
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
