"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardPenLine,
  FlaskConical,
  LayoutDashboard,
  Pill,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/patient/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patient/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/patient/medications", label: "Medications", icon: Pill },
  { href: "/patient/complaints", label: "Logs", icon: ClipboardPenLine },
  { href: "/patient/lab-reports", label: "Lab Reports", icon: FlaskConical },
];

export function PatientSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white pt-20 md:flex">
      <div className="px-6 pb-8">
        <p className="text-lg font-extrabold tracking-tight text-slate-900">
          FertilityCare
        </p>
        <p className="text-xs text-slate-500">Patient Portal</p>
      </div>

      <nav className="space-y-1 px-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mx-2 flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                active
                  ? "border-r-4 border-emerald-600 bg-slate-100 font-bold text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4">
        <Button className="w-full rounded-full bg-emerald-700 hover:bg-emerald-600">
          Book Consultation
        </Button>
      </div>
    </aside>
  );
}
