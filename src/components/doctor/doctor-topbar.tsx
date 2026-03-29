"use client";

import { Bell, CalendarDays, Search, Siren } from "lucide-react";
import { usePathname } from "next/navigation";

import { StatusBadge } from "@/components/patient/status-badge";
import { cn } from "@/lib/utils";

export function DoctorTopbar() {
  const pathname = usePathname();
  const isEmbryologyDarkRoute =
    pathname.startsWith("/doctor/cryo-inventory") ||
    pathname.startsWith("/doctor/ai-embryo-selection");

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-16 items-center justify-between px-6 backdrop-blur-md",
        isEmbryologyDarkRoute
          ? "border-b border-slate-800 bg-slate-950"
          : "border-b border-slate-200 bg-white"
      )}
    >
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search
            className={cn(
              "absolute left-3 top-1/2 size-4 -translate-y-1/2",
              isEmbryologyDarkRoute ? "text-slate-400" : "text-slate-400"
            )}
          />
          <input
            className={cn(
              "w-80 rounded py-1.5 pl-10 pr-3 text-sm outline-none focus:ring-1 focus:ring-teal-600",
              isEmbryologyDarkRoute
                ? "bg-slate-900 text-slate-50 placeholder:text-slate-400"
                : "bg-slate-100 text-slate-900 placeholder:text-slate-500"
            )}
            placeholder="Search patient or lab ID..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          className={cn(
            "relative rounded p-2",
            isEmbryologyDarkRoute ? "text-slate-300 hover:bg-slate-900" : "text-slate-600 hover:bg-slate-100"
          )}
        >
          <Bell className="size-4" />
        </button>
        <button
          className={cn(
            "rounded p-2",
            isEmbryologyDarkRoute ? "text-slate-300 hover:bg-slate-900" : "text-slate-600 hover:bg-slate-100"
          )}
        >
          <CalendarDays className="size-4" />
        </button>

        <div className={cn("h-8 w-px", isEmbryologyDarkRoute ? "bg-slate-800" : "bg-slate-200")} />

        <div className="flex items-center gap-2">
          <Siren className="size-4 text-red-600" />
          <StatusBadge label="Urgent Alerts" tone="danger" />
        </div>

        <div className={cn("h-8 w-px", isEmbryologyDarkRoute ? "bg-slate-800" : "bg-slate-200")} />

        <div className="text-right">
          <p className={cn("text-sm font-bold", isEmbryologyDarkRoute ? "text-slate-50" : "text-slate-900")}>Lead Physician</p>
          <p
            className={cn(
              "text-[10px] uppercase tracking-widest",
              isEmbryologyDarkRoute ? "text-sky-300" : "text-slate-500"
            )}
          >
            Clinic Director
          </p>
        </div>
      </div>
    </header>
  );
}
