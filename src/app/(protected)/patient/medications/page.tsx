"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { MedicationCard } from "@/components/patient/medication-card";
import { StatusBadge } from "@/components/patient/status-badge";

export default function PatientMedicationsPage() {
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/patient/medications");
        if (res.ok) {
          const json = await res.json();
          setMedications(json.data || []);
        }
      } catch (_) {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Build today's meds from API data
  const todayMeds = medications.map((m: any) => ({
    id: m.id,
    name: m.medication_name,
    dose: m.dose || "—",
    route: m.route || "Oral",
    time: m.frequency || "Daily",
    status: (m.medication_adherence?.[0]?.status === "TAKEN" ? "taken" : "upcoming") as "taken" | "upcoming",
  }));

  const morningMeds = todayMeds.slice(0, 1);
  const eveningMeds = todayMeds.slice(1);

  // Adherence: count taken vs total
  const takenCount = todayMeds.filter((m) => m.status === "taken").length;
  const adherencePct = todayMeds.length > 0 ? Math.round((takenCount / todayMeds.length) * 100) : 0;

  // History: flatten adherence records
  const history = medications.flatMap((m: any) =>
    (m.medication_adherence || []).map((a: any) => ({
      id: a.id,
      date: a.adherence_date ? new Date(a.adherence_date).toLocaleDateString() : "—",
      time: "—",
      medication: m.medication_name,
      dose: m.dose,
      status: a.status === "TAKEN" ? "Completed" : ("Missed" as string),
    }))
  );

  return (
    <div className="space-y-8">
      <header className="mb-2">
        <h1 className="text-3xl font-extrabold text-slate-900">Medication Tracker</h1>
      </header>

      {loading && (
        <p className="text-sm text-slate-500">Loading medications...</p>
      )}

      {!loading && medications.length === 0 && (
        <div className="rounded-xl border-l-4 border-slate-300 bg-slate-50 p-4">
          <p className="text-sm text-slate-600">No medications have been prescribed yet. Check back after your doctor appointment.</p>
        </div>
      )}

      {!loading && medications.length > 0 && (
        <>
          <section className="flex items-start gap-3 rounded-xl border-l-4 border-emerald-500 bg-emerald-50 p-4">
            <AlertTriangle className="mt-0.5 size-5 text-emerald-700" />
            <div>
              <p className="text-sm font-bold text-emerald-800">
                {takenCount} of {todayMeds.length} medications taken today
              </p>
              <p className="text-xs text-emerald-700">
                Keep following your protocol for best results.
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-8">
              <h2 className="text-lg font-bold text-emerald-900">Daily Timeline</h2>
              {morningMeds.length > 0 && (
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                    Morning Dose
                  </p>
                  <MedicationCard {...morningMeds[0]} />
                </div>
              )}
              {eveningMeds.length > 0 && (
                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                    Remaining Doses
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    {eveningMeds.map((med) => (
                      <MedicationCard key={med.id} {...med} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <aside className="space-y-4 lg:col-span-4">
              <article className="rounded-2xl bg-white p-6 text-center shadow-sm">
                <h3 className="text-lg font-bold">Weekly Adherence</h3>
                <div
                  className="mx-auto my-5 flex size-36 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#10b981 ${adherencePct}%, #e2e8f0 ${adherencePct}% 100%)`,
                  }}
                >
                  <div className="flex size-28 flex-col items-center justify-center rounded-full bg-white">
                    <p className="text-3xl font-extrabold text-emerald-700">{adherencePct}%</p>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">On Track</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600">Keep following your protocol.</p>
              </article>
            </aside>
          </section>

          {history.length > 0 && (
            <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="border-b p-6">
                <h2 className="text-lg font-bold">Medication History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Medication</th>
                      <th className="px-6 py-4">Dose</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {history.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-semibold">{row.date}</td>
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
          )}
        </>
      )}
    </div>
  );
}
