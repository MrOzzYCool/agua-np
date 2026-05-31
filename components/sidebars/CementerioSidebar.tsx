"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, MapPin, FileText, LogOut, Landmark, Home,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; roles: string[] };

const navItems: NavItem[] = [
  { href: "/cementerio/dashboard", label: "Inicio", icon: LayoutDashboard, roles: ["cobrador", "administrador"] },
  { href: "/cementerio/dashboard/parcelas", label: "Parcelas", icon: MapPin, roles: ["administrador"] },
  { href: "/cementerio/dashboard/ventas", label: "Ventas", icon: FileText, roles: ["cobrador", "administrador"] },
];

type Props = { rol: string; nombreUsuario: string };

export default function CementerioSidebar({ rol, nombreUsuario }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const visibleItems = navItems.filter((item) => item.roles.includes(rol));

  async function handleSignOut() {
    router.push("/");
  }

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col min-h-screen shadow-xl">
      <div className="px-6 py-7 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Landmark className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Cementerio</h1>
            <p className="text-[11px] text-slate-400 leading-tight">Nichos y Mausoleos</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <Link href="/"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition mb-3">
          <Home className="w-4 h-4" /> Portal Integral
        </Link>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
            (item.href !== "/cementerio/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive ? "bg-amber-500/15 text-amber-400" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}>
              <Icon className={`w-5 h-5 ${isActive ? "text-amber-400" : "text-slate-500"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-5 border-t border-slate-700/50">
        <p className="text-xs text-slate-500 mb-1 px-4 truncate">{nombreUsuario}</p>
        <p className="text-[10px] text-slate-600 mb-3 px-4 capitalize">{rol}</p>
        <button onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/15 hover:text-red-400 transition w-full">
          <LogOut className="w-5 h-5" /> Volver al Portal
        </button>
      </div>
    </aside>
  );
}
