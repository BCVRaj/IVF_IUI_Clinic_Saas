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
  const isEmbryologyDarkRoute =
    pathname.startsWith("/doctor/cryo-inventory") ||
    pathname.startsWith("/doctor/ai-embryo-selection");

  return (
    <aside
      className={cn(
        "hidden w-64 shrink-0 pt-8 md:flex md:flex-col",
        isEmbryologyDarkRoute
          ? "border-r border-slate-800 bg-slate-950"
          : "border-r border-slate-200 bg-white"
      )}
    >
      <div className="mb-8 px-6 pt-12">
        <h1 className={cn("text-lg font-black", isEmbryologyDarkRoute ? "text-slate-50" : "text-slate-900")}>IVF Precision</h1>
        <p
          className={cn(
            "text-[10px] font-semibold uppercase tracking-widest",
            isEmbryologyDarkRoute ? "text-sky-300" : "text-slate-500"
          )}
        >
          {isEmbryologyDarkRoute ? "Sub-Zero Lab" : "Scientific Workspace"}
        </p>
      </div>

      <nav className="space-y-1 px-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded px-3 py-2 text-sm font-semibold uppercase tracking-widest transition-all",
                active
                  ? isEmbryologyDarkRoute
                    ? "border-l-4 border-sky-300 bg-slate-900 text-sky-300"
                    : "bg-slate-100 text-slate-900"
                  : isEmbryologyDarkRoute
                    ? "text-slate-300 hover:bg-slate-900 hover:text-sky-300"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
