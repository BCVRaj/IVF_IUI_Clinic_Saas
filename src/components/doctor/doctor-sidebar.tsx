"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ActivitySquare,
  BrainCircuit,
  FileBarChart,
  FlaskConical,
  ShieldAlert,
  KanbanSquare,
  LayoutDashboard,
  Snowflake,
} from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctor/nurse-coordination", label: "Nurse Coordination", icon: KanbanSquare },
  { href: "/doctor/critical-care", label: "Critical Care", icon: ShieldAlert },
  { href: "/doctor/cycle-monitoring", label: "IVF Cycle Monitoring", icon: ActivitySquare },
  { href: "/doctor/lab-board", label: "Lab Board", icon: FlaskConical },
  { href: "/doctor/cryo-inventory", label: "Cryo Inventory", icon: Snowflake },
  { href: "/doctor/ai-embryo-selection", label: "AI Embryo Selection", icon: BrainCircuit },
  { href: "/doctor/lab-reports", label: "Lab Reports", icon: FileBarChart },
];

export function DoctorSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 pt-8 bg-white shadow-sm md:flex md:flex-col">
      <div className="mb-8 px-6 pt-12">
        <h1 className="text-lg font-black text-slate-900">IVF Precision</h1>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Scientific Workspace
        </p>
      </div>

      <nav className="space-y-0.5 px-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold uppercase tracking-widest transition-all duration-200",
                active
                  ? "bg-slate-100 text-slate-900 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
