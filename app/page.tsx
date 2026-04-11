import Link from "next/link";
import { Droplets, Landmark, Building2 } from "lucide-react";

const subsystems = [
  {
    href: "/yaku/dashboard",
    title: "YAKU",
    subtitle: "Sistema de Agua",
    description: "Gestión de socios, pagos mensuales, morosidad y reportes de recaudación.",
    icon: Droplets,
    color: "sky",
    bgClass: "bg-sky-500",
    shadowClass: "shadow-sky-500/20",
    hoverClass: "hover:border-sky-300 hover:shadow-sky-100",
  },
  {
    href: "/cementerio/dashboard",
    title: "Cementerio",
    subtitle: "Nichos y Mausoleos",
    description: "Inventario de parcelas, ventas con contratos y cuotas de pago.",
    icon: Landmark,
    color: "amber",
    bgClass: "bg-amber-500",
    shadowClass: "shadow-amber-500/20",
    hoverClass: "hover:border-amber-300 hover:shadow-amber-100",
  },
  {
    href: "/alquileres/dashboard",
    title: "Alquileres",
    subtitle: "Estadio y Losa Deportiva",
    description: "Reservas de instalaciones comunitarias y cobro de alquileres.",
    icon: Building2,
    color: "emerald",
    bgClass: "bg-emerald-500",
    shadowClass: "shadow-emerald-500/20",
    hoverClass: "hover:border-emerald-300 hover:shadow-emerald-100",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-sky-50 to-slate-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Portal Integral
          </h1>
          <p className="text-slate-500 text-sm">
            Asociación AAHH Nicolás de Piérola — Seleccione un subsistema
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subsystems.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.href}
                href={s.href}
                className={`bg-white rounded-2xl border border-slate-200 p-8 shadow-sm transition-all duration-200 ${s.hoverClass} hover:shadow-lg group`}
              >
                <div className={`w-14 h-14 ${s.bgClass} rounded-xl flex items-center justify-center mb-5 shadow-lg ${s.shadowClass} group-hover:scale-105 transition-transform`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">{s.title}</h2>
                <p className="text-xs text-slate-400 mb-3">{s.subtitle}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{s.description}</p>
              </Link>
            );
          })}
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-10">
          Portal Integral · Asociación AAHH Nicolás de Piérola
        </p>
      </div>
    </div>
  );
}
