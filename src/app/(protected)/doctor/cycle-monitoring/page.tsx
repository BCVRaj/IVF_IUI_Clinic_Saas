"use client";

import { useEffect, useState } from "react";
import { StatusBadge } from "@/components/patient/status-badge";
import { Button } from "@/components/ui/button";
import { hormoneSeries, embryoRows } from "@/lib/mock-doctor-data";

function MiniTrend({ values }: { values: readonly number[] }) {
  return (
    <div className="flex h-10 w-full items-end overflow-hidden rounded bg-slate-200">
      {values.map((v, idx) => (
        <div key={idx} className="mx-[1px] flex-1 bg-teal-700/70" style={{ height: `${v}%` }} />
      ))}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  PLANNING: "bg-slate-300",
  STIMULATION: "bg-teal-500",
  RETRIEVAL: "bg-amber-500",
  TRANSFER: "bg-blue-500",
  COMPLETED: "bg-emerald-500",
  CANCELLED: "bg-red-400",
};

export default function DoctorCycleMonitoringPage() {
  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/doctor/cycles");
        if (res.ok) {
          const json = await res.json();
          const list = json.data || [];
          setCycles(list);
          if (list.length > 0) setSelected(list[0]);
        }
      } catch (_) {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const timelineSteps = selected
    ? [
        { label: "Start", date: selected.start_date },
        { label: "Stimulation", date: selected.baseline_scan_date },
        { label: "Trigger", date: selected.trigger_date },
        { label: "Retrieval", date: selected.retrieval_date },
        { label: "Transfer", date: selected.transfer_date },
      ]
    : [];

  return (
    <div className="space-y-10 bg-slate-50 text-slate-900">
      {loading && <p className="text-sm text-slate-500">Loading cycles...</p>}

      {!loading && cycles.length === 0 && (
        <div className="rounded-xl bg-white p-8 shadow-sm text-center">
          <p className="text-slate-600">No IVF cycles found. Create a cycle to begin monitoring.</p>
        </div>
      )}

      {!loading && cycles.length > 0 && (
        <>
          {/* Cycle selector */}
          {cycles.length > 1 && (
            <section className="flex flex-wrap gap-2">
              {cycles.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wide border transition-colors ${
                    selected?.id === c.id
                      ? "bg-teal-700 text-white border-teal-700"
                      : "bg-white text-slate-600 border-slate-300 hover:border-teal-400"
                  }`}
                >
                  {c.protocol} — {c.patient_id}
                </button>
              ))}
            </section>
          )}

          <section>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Cycle Progression</h2>
              <StatusBadge label={selected?.status || "—"} tone="warning" />
            </div>

            <div className="rounded-lg bg-slate-100 p-6">
              <div className="flex items-center">
                {timelineSteps.map((step, idx) => (
                  <div key={step.label} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500">{step.label}</span>
                      <span
                        className={`size-4 rounded-full ${
                          step.date
                            ? `${STATUS_COLORS[selected?.status] || "bg-slate-400"} ring-2 ring-offset-1 ring-teal-200`
                            : "border-2 border-slate-300 bg-white"
                        }`}
                      />
                      {step.date && (
                        <span className="text-[9px] text-slate-500">
                          {new Date(step.date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {idx < timelineSteps.length - 1 && (
                      <div className="mx-2 h-1 flex-1 bg-slate-300" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-12 gap-6">
            <article className="col-span-12 rounded bg-white p-8 shadow-sm lg:col-span-8">
              <div className="mb-8 flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">
                    Follicle Growth Distribution
                  </h3>
                  <p className="text-xs text-slate-600">Daily ultrasound measurement trend (mm)</p>
                </div>
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-teal-700" /> Left Ovary
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-slate-900" /> Right Ovary
                  </span>
                </div>
              </div>
              <div className="h-64 rounded bg-slate-100 p-4">
                <svg className="h-full w-full" viewBox="0 0 800 200">
                  <line x1="0" y1="40" x2="800" y2="40" stroke="#d9dde2" strokeDasharray="4" />
                  <line x1="0" y1="80" x2="800" y2="80" stroke="#d9dde2" strokeDasharray="4" />
                  <line x1="0" y1="120" x2="800" y2="120" stroke="#d9dde2" strokeDasharray="4" />
                  <line x1="0" y1="160" x2="800" y2="160" stroke="#d9dde2" strokeDasharray="4" />
                  <path d="M0,180 Q100,175 200,160 T400,120 T600,60 T800,20" fill="none" stroke="#006a6a" strokeWidth="3" />
                  <path d="M0,185 Q120,170 240,150 T480,100 T720,50 T800,40" fill="none" stroke="#001736" strokeWidth="3" />
                </svg>
              </div>
            </article>

            <aside className="col-span-12 space-y-4 lg:col-span-4">
              <article className="rounded bg-slate-100 p-6">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-900">Hormone Trends</h3>
                <div className="space-y-5">
                  {[
                    { label: "Estradiol (E2)", value: "—", series: hormoneSeries.e2 },
                    { label: "Progesterone (P4)", value: "—", series: hormoneSeries.p4 },
                    { label: "LH Surge Track", value: "—", series: hormoneSeries.lh },
                  ].map((h) => (
                    <div key={h.label}>
                      <div className="mb-2 flex items-end justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{h.label}</span>
                        <span className="text-sm font-bold text-slate-900">{h.value}</span>
                      </div>
                      <MiniTrend values={h.series} />
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded border-l-4 border-teal-700 bg-white p-6 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900">Decision Prompt: Trigger Shot Ready?</h4>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
                  Review latest scan results and hormone levels before scheduling trigger injection.
                </p>
                <div className="mt-4 space-y-2">
                  <Button className="w-full rounded bg-slate-900 hover:bg-slate-800">Schedule Trigger (Ovidrel)</Button>
                  <Button variant="secondary" className="w-full rounded">Wait 24h & Re-Scan</Button>
                </div>
              </article>
            </aside>
          </section>

          <section className="rounded bg-white p-8 shadow-sm">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <h3 className="text-xl font-bold tracking-tight">Embryo Development Laboratory</h3>
                <p className="text-sm text-slate-600">
                  {selected ? `Cycle ID: ${selected.id?.slice(0, 8)} — Patient: ${selected.patient_id}` : ""}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <th className="pb-4 px-4">Sample ID</th>
                    <th className="pb-4 px-4">Day 1 (Fert)</th>
                    <th className="pb-4 px-4">Day 3 (Cleave)</th>
                    <th className="pb-4 px-4">Day 5 (Blast)</th>
                    <th className="pb-4 px-4">Day 6 (Grade)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 text-sm">
                  {embryoRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-5 font-bold text-slate-900">{row.id}</td>
                      <td className="px-4 py-5">{row.d1}</td>
                      <td className="px-4 py-5">{row.d3}</td>
                      <td className="px-4 py-5">{row.d5}</td>
                      <td className="px-4 py-5 font-bold text-teal-700">{row.d6}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
