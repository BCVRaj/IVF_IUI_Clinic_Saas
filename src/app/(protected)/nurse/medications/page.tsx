import { CheckCircle2 } from "lucide-react";

import { StatusBadge } from "@/components/patient/status-badge";
import {
  medicationSchedule,
  selectedPatient,
  wardMeds,
} from "@/lib/mock-nurse-data";

export default function NurseMedicationsPage() {
  return (
    <div className="space-y-8">
      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#000666]">
              {selectedPatient.name}
            </h1>
            <div className="mt-2 flex gap-2">
              <StatusBadge label={`ID: ${selectedPatient.id}`} />
              <StatusBadge label={selectedPatient.cycleDay} tone="warning" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <article className="col-span-12 rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-8">
            <div className="rounded-t-xl bg-slate-100 px-4 py-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#1A237E]">
                Today&apos;s Protocol Schedule
              </h2>
            </div>
            <div className="space-y-2 p-2">
              {medicationSchedule.map((item) => (
                <div key={item.id} className="flex items-center gap-4 rounded-lg bg-slate-50 p-4">
                  <div className="w-16 text-center">
                    <p className="text-lg font-black text-slate-800">{item.time}</p>
                    <p className="text-[10px] font-bold uppercase text-slate-500">{item.meridiem}</p>
                  </div>
                  <div className="flex-1 border-l-2 border-slate-300 pl-4">
                    <p className="text-base font-bold text-slate-900">{item.medication}</p>
                    <p className="text-xs text-slate-600">
                      Dosage: {item.dosage} · {item.notes}
                    </p>
                  </div>
                  <div>
                    {item.status === "Administered" ? (
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 className="size-4" />
                        <span className="text-xs font-bold">Done</span>
                      </div>
                    ) : (
                      <StatusBadge
                        label={item.status}
                        tone={item.status === "Pending" ? "danger" : "neutral"}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <aside className="col-span-12 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-4">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#1A237E]">
              Shift Handover Notes
            </h3>
            <textarea
              rows={8}
              defaultValue="Patient reports mild discomfort at previous injection site (left lower quadrant). Rotate to right side for next administration."
              className="w-full resize-none rounded-lg bg-slate-100 p-3 text-sm"
            />
          </aside>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between bg-slate-100 px-6 py-4">
          <h2 className="text-xl font-black tracking-tight text-slate-800">
            Ward-Wide Due Medications
          </h2>
          <StatusBadge label="4 Overdue" tone="danger" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
              <tr>
                <th className="px-6 py-3">Due Time</th>
                <th className="px-6 py-3">Patient</th>
                <th className="px-6 py-3">Medication</th>
                <th className="px-6 py-3">Route/Dose</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {wardMeds.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-mono font-bold text-slate-800">{row.dueTime}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">{row.patient}</p>
                    <p className="text-[10px] text-slate-500">Room {row.room}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{row.medication}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{row.dose}</td>
                  <td className="px-6 py-4">
                    <StatusBadge
                      label={row.status}
                      tone={
                        row.status === "Urgent"
                          ? "danger"
                          : row.status === "Upcoming"
                            ? "warning"
                            : "neutral"
                      }
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#1A237E] hover:bg-slate-100">
                      Process
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
