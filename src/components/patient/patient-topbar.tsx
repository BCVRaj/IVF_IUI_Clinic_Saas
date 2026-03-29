import { Bell, Flower2 } from "lucide-react";

import { patientUser } from "@/lib/mock-patient-data";

export function PatientTopbar() {
  return (
    <header className="fixed top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
          <Flower2 className="size-4" />
        </div>
        <p className="text-xl font-bold tracking-tight text-slate-900">FertilityCare</p>
      </div>

      <div className="flex items-center gap-3">
        <button className="rounded-full p-2 text-emerald-700 transition-colors hover:bg-emerald-50">
          <Bell className="size-5" />
        </button>
        <div className="flex size-9 items-center justify-center rounded-full border-2 border-emerald-100 bg-emerald-50 text-xs font-bold text-emerald-700">
          {patientUser.initials}
        </div>
      </div>
    </header>
  );
}
