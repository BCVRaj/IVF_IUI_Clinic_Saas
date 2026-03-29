import { AlertTriangle } from "lucide-react";

import { MedicationCard } from "@/components/patient/medication-card";
import { StatusBadge } from "@/components/patient/status-badge";
import {
  medicationHistory,
  todaysMedications,
  weeklyAdherence,
} from "@/lib/mock-patient-data";

export default function PatientMedicationsPage() {
  return (
    <div className="space-y-8">
      <header className="mb-2">
        <h1 className="text-3xl font-extrabold text-slate-900">Medication Tracker</h1>
      </header>

      <section className="flex items-start gap-3 rounded-xl border-l-4 border-rose-500 bg-rose-100/70 p-4">
        <AlertTriangle className="mt-0.5 size-5 text-rose-700" />
        <div>
          <p className="text-sm font-bold text-rose-800">Low Stock Alert: Menopur 75 IU</p>
          <p className="text-xs text-rose-700">
            You have 2 doses remaining. Please contact your pharmacy soon.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <h2 className="text-lg font-bold text-emerald-900">Daily Timeline</h2>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
              Morning · 07:00 AM - 09:00 AM
            </p>
            <MedicationCard {...todaysMedications[0]} />
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
              Evening · 07:00 PM - 09:00 PM
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {todaysMedications.slice(1).map((medication) => (
                <MedicationCard key={medication.id} {...medication} />
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4 lg:col-span-4">
          <article className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <h3 className="text-lg font-bold">Weekly Adherence</h3>
            <div
              className="mx-auto my-5 flex size-36 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#10b981 ${weeklyAdherence}%, #e2e8f0 ${weeklyAdherence}% 100%)`,
              }}
            >
              <div className="flex size-28 flex-col items-center justify-center rounded-full bg-white">
                <p className="text-3xl font-extrabold text-emerald-700">{weeklyAdherence}%</p>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">On Track</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Excellent consistency this week. Keep following the protocol.
            </p>
          </article>
        </aside>
      </section>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="border-b p-6">
          <h2 className="text-lg font-bold">Medication History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Medication</th>
                <th className="px-6 py-4">Dose</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {medicationHistory.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-semibold">{row.date}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{row.time}</td>
                  <td className="px-6 py-4 text-sm font-bold">{row.medication}</td>
                  <td className="px-6 py-4 text-sm">{row.dose}</td>
                  <td className="px-6 py-4">
                    <StatusBadge
                      label={row.status}
                      tone={row.status === "Completed" ? "success" : "danger"}
                    />
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
