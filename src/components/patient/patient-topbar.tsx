import { Bell, Flower2 } from "lucide-react";

import { patientUser } from "@/lib/mock-patient-data";

export function PatientTopbar() {
  return (
    <header className="fixed top-0 z-40 flex h-16 w-full items-center justify-between bg-white px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
          <Flower2 className="size-4" />
        </div>
        <p className="text-xl font-bold tracking-tight text-slate-900">FertilityCare</p>
      </div>

      <div className="flex items-center gap-3">
        <button className="rounded-full p-2 text-slate-600 transition-all hover:bg-slate-100 hover:text-emerald-700">
          <Bell className="size-5" />
        </button>
        <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-xs font-bold text-white shadow-sm">
          {patientUser.initials}
        </div>
      </div>
    </header>
  );
}
