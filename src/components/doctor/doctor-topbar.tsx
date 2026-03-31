"use client";

import { Bell, CalendarDays, Search, Siren } from "lucide-react";

import { StatusBadge } from "@/components/patient/status-badge";

export function DoctorTopbar() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-white px-6 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-80 rounded bg-slate-100 py-1.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-teal-600"
            placeholder="Search patient or lab ID..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded p-2 text-slate-600 hover:bg-slate-100">
          <Bell className="size-4" />
        </button>
        <button className="rounded p-2 text-slate-600 hover:bg-slate-100">
          <CalendarDays className="size-4" />
        </button>

        <div className="mx-2 h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-2">
          <Siren className="size-4 text-red-600" />
          <StatusBadge label="Urgent Alerts" tone="danger" />
        </div>

        <div className="mx-2 h-6 w-px bg-slate-200" />

        <div className="text-right">
          <p className="text-sm font-bold text-slate-900">Lead Physician</p>
          <p className="text-[10px] uppercase tracking-widest text-slate-500">Clinic Director</p>
        </div>
      </div>
    </header>
  );
}
