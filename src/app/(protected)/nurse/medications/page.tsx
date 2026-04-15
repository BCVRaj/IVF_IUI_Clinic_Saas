"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { StatusBadge } from "@/components/patient/status-badge";
import { Button } from "@/components/ui/button";

export default function NurseMedicationsPage() {
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [handoverNote, setHandoverNote] = useState("");

  const fetchMedications = async () => {
    try {
      const res = await fetch("/api/nurse/medications");
      if (res.ok) {
        const json = await res.json();
        setMedications(json.data || []);
      }
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMedications(); }, []);

  const handleConfirm = async (adherenceId: string) => {
    try {
      setConfirming(adherenceId);
      const res = await fetch(`/api/nurse/medications/${adherenceId}/confirm`, { method: "PUT" });
      if (res.ok) await fetchMedications();
    } catch (_) {}
    finally { setConfirming(null); }
  };

  // Group medications by patient
  const byPatient: Record<string, { patient: any; meds: any[] }> = {};
  medications.forEach((m: any) => {
    const p = m.patients;
    const pid = m.patient_id;
    if (!byPatient[pid]) byPatient[pid] = { patient: p, meds: [] };
    byPatient[pid].meds.push(m);
  });

  const patientGroups = Object.values(byPatient);

  // Flatten all pending adherence records for the "ward-wide" table
  const wardMeds = medications.flatMap((m: any) =>
    (m.medication_adherence || [])
      .filter((a: any) => a.status !== "TAKEN")
      .map((a: any) => ({
        adherenceId: a.id,
        patient: m.patients ? `${m.patients.first_name} ${m.patients.last_name}` : m.patient_id,
        medication: m.medication_name,
        dose: `${m.dose || "—"} · ${m.route || "—"}`,
        dueTime: a.adherence_date ? new Date(a.adherence_date).toLocaleDateString() : "Today",
        status: "Pending",
      }))
  );

  return (
    <div className="space-y-8">
      {loading && <p className="text-sm text-slate-500">Loading medications...</p>}

      {!loading && medications.length === 0 && (
        <div className="rounded-xl bg-white p-8 shadow-sm text-center">
          <p className="text-slate-600">No medications found for your assigned patients.</p>
        </div>
      )}

      {!loading && patientGroups.length > 0 && (
        <section>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-[#000666]">
                Medications
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {patientGroups.length} patient{patientGroups.length !== 1 ? "s" : ""} assigned
              </p>
            </div>
          </div>

          {/* Per-patient protocol */}
          {patientGroups.map(({ patient, meds }) => (
            <div key={meds[0]?.patient_id} className="mb-8 grid grid-cols-12 gap-6">
              <article className="col-span-12 rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-8">
                <div className="rounded-t-xl bg-slate-100 px-4 py-3">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-[#1A237E]">
                    {patient ? `${patient.first_name} ${patient.last_name}` : meds[0]?.patient_id} — Protocol
                  </h2>
                </div>
                <div className="space-y-2 p-2">
                  {meds.map((m: any) => {
                    const latestAdherence = m.medication_adherence?.[0];
                    const taken = latestAdherence?.status === "TAKEN";
                    return (
                      <div key={m.id} className="flex items-center gap-4 rounded-lg bg-slate-50 p-4">
                        <div className="flex-1 pl-2">
                          <p className="text-base font-bold text-slate-900">{m.medication_name}</p>
                          <p className="text-xs text-slate-600">
                            {m.dose} · {m.route} · {m.frequency}
                          </p>
                          {m.instructions && (
                            <p className="text-xs text-slate-500 mt-1">{m.instructions}</p>
                          )}
                        </div>
                        <div>
                          {taken ? (
                            <div className="flex items-center gap-2 text-emerald-700">
                              <CheckCircle2 className="size-4" />
                              <span className="text-xs font-bold">Confirmed</span>
                            </div>
                          ) : latestAdherence ? (
                            <Button
                              size="sm"
                              disabled={confirming === latestAdherence.id}
                              onClick={() => handleConfirm(latestAdherence.id)}
                              className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white"
                            >
                              {confirming === latestAdherence.id ? "..." : "Confirm Given"}
                            </Button>
                          ) : (
                            <StatusBadge label="No schedule" tone="neutral" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>

              <aside className="col-span-12 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-4">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#1A237E]">
                  Shift Handover Notes
                </h3>
                <textarea
                  rows={8}
                  value={handoverNote}
                  onChange={(e) => setHandoverNote(e.target.value)}
                  placeholder="Record any observations, injection site notes, or handover details..."
                  className="w-full resize-none rounded-lg bg-slate-100 p-3 text-sm"
                />
              </aside>
            </div>
          ))}
        </section>
      )}

      {/* Ward-wide due medications */}
      {!loading && wardMeds.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between bg-slate-100 px-6 py-4">
            <h2 className="text-xl font-black tracking-tight text-slate-800">Pending Administrations</h2>
            <StatusBadge label={`${wardMeds.length} Pending`} tone="danger" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                <tr>
                  <th className="px-6 py-3">Due Date</th>
                  <th className="px-6 py-3">Patient</th>
                  <th className="px-6 py-3">Medication</th>
                  <th className="px-6 py-3">Dose / Route</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {wardMeds.map((row) => (
                  <tr key={row.adherenceId} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-mono font-bold text-slate-800">{row.dueTime}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">{row.patient}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{row.medication}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{row.dose}</td>
                    <td className="px-6 py-4">
                      <StatusBadge label={row.status} tone="warning" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        disabled={confirming === row.adherenceId}
                        onClick={() => handleConfirm(row.adherenceId)}
                        className="rounded px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#1A237E] hover:bg-slate-100 disabled:opacity-50"
                      >
                        {confirming === row.adherenceId ? "..." : "Process"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
