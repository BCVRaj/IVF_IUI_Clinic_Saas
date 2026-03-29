"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  FlaskConical,
  LayoutDashboard,
  Pill,
  UserPlus,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/nurse/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/nurse/onboarding", label: "Patient Onboarding", icon: UserPlus },
  { href: "/nurse/medications", label: "Medication Tracker", icon: Pill },
  { href: "/nurse/complaints", label: "Complaint Logs", icon: ClipboardList },
  { href: "/nurse/lab-reports", label: "Lab Report Uploader", icon: FlaskConical },
];

export function NurseSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white pt-20 md:flex md:flex-col">
      <div className="px-6 pb-7">
        <h2 className="text-lg font-black text-slate-900">IVF Command</h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Precision Care</p>
      </div>

      <nav className="space-y-1 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mx-2 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                active
                  ? "translate-x-0.5 rounded-l-lg border-r-4 border-slate-900 bg-slate-100 text-slate-900 shadow-sm"
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
