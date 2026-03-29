import { AlertTriangle, Flag } from "lucide-react";

import { StatusBadge } from "@/components/patient/status-badge";
import { Button } from "@/components/ui/button";
import {
  nurseAlerts,
  nurseQueue,
  nurseStats,
  nurseTimeline,
} from "@/lib/mock-nurse-data";

export default function NurseDashboardPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#000666]">
            Clinic Operations
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Real-time patient flow and clinical logistics.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="rounded-lg">
            Export Log
          </Button>
          <Button className="rounded-lg bg-gradient-to-r from-[#000666] to-[#1a237e] hover:opacity-90">
            New Check-in
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {nurseStats.map((stat) => (
          <article key={stat.id} className="rounded-xl border-l-4 border-[#1A237E] bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {stat.label}
            </p>
            <div className="mt-1 flex items-end gap-2">
              <p className="text-3xl font-black text-[#1A237E]">{stat.value}</p>
              <p className="text-xs font-semibold text-slate-500">{stat.detail}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-12 gap-6">
        <article className="col-span-12 overflow-hidden rounded-xl bg-slate-100 shadow-sm lg:col-span-8">
          <div className="flex items-center justify-between bg-slate-200 px-6 py-4">
            <h2 className="text-lg font-bold text-[#1A237E]">Active Patient Queue</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-slate-100 text-[10px] uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-6 py-3">Patient Identity</th>
                  <th className="px-6 py-3">Cycle Stage</th>
                  <th className="px-6 py-3">Next Action Needed</th>
                  <th className="px-6 py-3 text-right">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 bg-white">
                {nurseQueue.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold">{row.name}</p>
                      <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
                        ID: #{row.id}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-700">{row.stage}</td>
                    <td className="px-6 py-4 text-xs text-slate-700">{row.action}</td>
                    <td className="px-6 py-4 text-right">
                      {row.priority === "High" ? (
                        <Flag className="ml-auto size-4 fill-red-600 text-red-600" />
                      ) : (
                        <Flag className="ml-auto size-4 text-slate-300" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="col-span-12 space-y-5 lg:col-span-4">
          <article className="rounded-xl bg-[#5c1800] p-5 text-white shadow-lg">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider">
              <AlertTriangle className="size-4" />
              Clinical Alerts
            </h3>
            <div className="space-y-3">
              {nurseAlerts.map((alert) => (
                <div key={alert.id} className="rounded-lg border-l-4 border-amber-200 bg-black/20 p-3">
                  <p className="text-xs font-bold text-amber-100">{alert.title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-white/85">{alert.body}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#1A237E]">Timeline</h3>
              <StatusBadge label="Today" />
            </div>
            <div className="space-y-4 border-l-2 border-slate-200 pl-5">
              {nurseTimeline.map((item) => (
                <div key={item.id} className="relative">
                  <span
                    className={`absolute -left-[26px] top-1 size-3 rounded-full border-2 border-white ${
                      item.active ? "bg-[#1A237E]" : "bg-slate-300"
                    }`}
                  />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {item.time} — {item.place}
                  </p>
                  <p className="text-sm font-bold text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-500">Patient: {item.patient}</p>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
