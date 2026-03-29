import { Bell, CalendarDays, Search } from "lucide-react";

export function NurseTopbar() {
  return (
    <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <span className="text-xl font-extrabold tracking-tighter text-slate-900">
          Clinical Precision IVF
        </span>
      </div>

      <div className="mx-8 hidden max-w-2xl flex-1 lg:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-lg border-none bg-slate-100 py-2 pl-10 pr-4 text-sm outline-none ring-[#1A237E]/20 focus:ring-2"
            placeholder="Global patient search (ID, Name, or DOB)..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="hidden items-center gap-2 text-slate-500 sm:flex">
          <CalendarDays className="size-4" />
          <button className="relative rounded-full p-2 hover:bg-slate-50">
            <Bell className="size-4" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500" />
          </button>
        </div>

        <div className="h-8 w-px bg-slate-200/70" />

        <div className="text-right">
          <p className="text-xs font-bold text-slate-900">Nurse/Receptionist</p>
          <p className="text-[10px] uppercase tracking-widest text-slate-500">
            Operational Staff
          </p>
        </div>
      </div>
    </header>
  );
}
