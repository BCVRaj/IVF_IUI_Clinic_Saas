"use client";

import React, { useEffect, useState } from "react";
import { mockCycles } from "@/lib/mock-doctor-data";
import { generateCycleReportPDF } from "@/lib/pdf-generator";

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { key: "investigation", label: "Investigation",       icon: "🔬", statuses: ["PLANNING"] },
  { key: "stimulation",   label: "Ovarian Stimulation", icon: "💉", statuses: ["STIMULATION"] },
  { key: "egg_pickup",    label: "Egg Pickup",          icon: "🥚", statuses: ["RETRIEVAL"] },
  { key: "embryology",    label: "Embryology",          icon: "🧫", statuses: ["FERTILIZATION", "EMBRYO_CULTURE"] },
  { key: "freezing",      label: "Embryo Freezing",     icon: "❄️", statuses: ["FREEZING"] },
  { key: "transfer",      label: "Embryo Transfer",     icon: "🔄", statuses: ["TRANSFER"] },
  { key: "outcome",       label: "Outcome",             icon: "📊", statuses: ["OUTCOME_PENDING"] },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// ── Shared helpers ────────────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-xs font-black text-white">
      {name ? name.charAt(0) : "?"}
    </div>
  );
}

function Pill({
  label,
  variant = "neutral",
}: {
  label: string;
  variant?: "neutral" | "success" | "warn" | "danger" | "info" | "purple" | "pulse-green";
}) {
  const cls: Record<string, string> = {
    neutral:      "bg-slate-100 text-slate-600",
    success:      "bg-emerald-100 text-emerald-700",
    warn:         "bg-amber-100 text-amber-700",
    danger:       "bg-red-100 text-red-600",
    info:         "bg-blue-100 text-blue-700",
    purple:       "bg-purple-100 text-purple-700",
    "pulse-green":"bg-emerald-500 text-white animate-pulse",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${cls[variant]}`}>
      {label}
    </span>
  );
}

function Sparkline({ values, color = "#14b8a6" }: { values: readonly number[]; color?: string }) {
  if (!values || values.length === 0) return null;
  const arr = [...values];
  const max = Math.max(...arr) || 1;
  const pts = arr.map((v, i) => `${(i / Math.max(1, arr.length - 1)) * 72},${18 - (v / max) * 16}`).join(" ");
  return (
    <svg viewBox="0 0 72 20" className="h-5 w-18 shrink-0">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

// ── Shared table wrapper ──────────────────────────────────────────────────────
function DataTable({
  headers,
  children,
  empty,
}: {
  headers: string[];
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-max text-left">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
          {empty ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-12 text-center text-slate-400 text-sm">
                No patients in this phase
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Tab: Investigation ────────────────────────────────────────────────────────
function InvestigationTable({ cycles, onRowClick }: { cycles: any[]; onRowClick: (c: any) => void }) {
  const headers = ["Patient", "Protocol", "Cycle Day", "AMH", "FSH", "E2", "TSH", "AFC / Other", "Flags", "Status"];
  return (
    <DataTable headers={headers} empty={cycles.length === 0}>
      {cycles.map((c) => {
        const inv: any[] = c.investigations ?? [];
        const get = (name: string) => inv.find((i) => i.name === name);
        const flagged = inv.filter((i) => i.flag).length;
        const pending = inv.filter((i) => i.status !== "Completed").length;
        return (
          <tr key={c.id} className="hover:bg-teal-50 cursor-pointer transition-colors" onClick={() => onRowClick(c)}>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Avatar name={c.patientName} />
                <div>
                  <p className="font-semibold text-slate-900 leading-tight">{c.patientName}</p>
                  <p className="text-[10px] text-slate-400">Age {c.age}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.protocol}</td>
            <td className="px-4 py-3 font-medium whitespace-nowrap">{c.cycleDay}</td>
            <td className="px-4 py-3 whitespace-nowrap">
              <span className={get("AMH")?.flag ? "font-bold text-red-600" : ""}>{get("AMH")?.value ?? "—"}</span>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              <span className={get("FSH")?.flag ? "font-bold text-red-600" : ""}>{get("FSH")?.value ?? "—"}</span>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">{get("Estradiol (E2)")?.value ?? "—"}</td>
            <td className="px-4 py-3 whitespace-nowrap">{get("TSH")?.value ?? "—"}</td>
            <td className="px-4 py-3 whitespace-nowrap text-slate-500">
              {inv.find((i) => !["AMH","FSH","Estradiol (E2)","TSH"].includes(i.name))?.name ?? "—"}
            </td>
            <td className="px-4 py-3">
              {flagged > 0 ? (
                <Pill label={`⚑ ${flagged} Flag${flagged > 1 ? "s" : ""}`} variant="danger" />
              ) : (
                <Pill label="Clear" variant="success" />
              )}
            </td>
            <td className="px-4 py-3">
              {pending > 0 ? (
                <Pill label={`${pending} Pending`} variant="warn" />
              ) : (
                <Pill label="All Done" variant="success" />
              )}
            </td>
          </tr>
        );
      })}
    </DataTable>
  );
}

// ── Tab: Stimulation ─────────────────────────────────────────────────────────
function StimulationTable({ cycles, onRowClick }: { cycles: any[]; onRowClick: (c: any) => void }) {
  const headers = ["Patient", "Protocol", "Cycle Day", "E2 (pg/mL)", "LH (mIU/mL)", "P4 (ng/mL)", "Left Ovary", "Right Ovary", "Lead Follicle", "Action"];
  return (
    <DataTable headers={headers} empty={cycles.length === 0}>
      {cycles.map((c) => {
        const s = c.stimulation || { e2: [], lh: [], p4: [], leftFollicles: [], rightFollicles: [], leadFollicle: "—", triggerReady: false };
        const lastE2 = s.e2[s.e2.length - 1] ?? "—";
        const lastLH = s.lh[s.lh.length - 1] ?? "—";
        const lastP4 = s.p4[s.p4.length - 1] ?? "—";
        return (
          <tr key={c.id} className="hover:bg-teal-50 cursor-pointer transition-colors" onClick={() => onRowClick(c)}>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Avatar name={c.patientName} />
                <div>
                  <p className="font-semibold text-slate-900 leading-tight">{c.patientName}</p>
                  <p className="text-[10px] text-slate-400">Age {c.age}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.protocol}</td>
            <td className="px-4 py-3 font-medium whitespace-nowrap">{c.cycleDay}</td>
            {/* E2 */}
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-teal-700 tabular-nums">{lastE2.toLocaleString()}</span>
                <Sparkline values={s.e2} color="#0d9488" />
              </div>
            </td>
            {/* LH */}
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-600 tabular-nums">{lastLH}</span>
                <Sparkline values={s.lh} color="#6366f1" />
              </div>
            </td>
            {/* P4 */}
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-600 tabular-nums">{lastP4}</span>
                <Sparkline values={s.p4} color="#f59e0b" />
              </div>
            </td>
            <td className="px-4 py-3 tabular-nums whitespace-nowrap">{s.leftFollicles?.length ?? 0} follicles</td>
            <td className="px-4 py-3 tabular-nums whitespace-nowrap">{s.rightFollicles?.length ?? 0} follicles</td>
            <td className="px-4 py-3 font-semibold whitespace-nowrap">{s.leadFollicle}</td>
            <td className="px-4 py-3">
              {s.triggerReady ? (
                <Pill label="Trigger Ready" variant="success" />
              ) : (
                <Pill label="Monitoring" variant="neutral" />
              )}
            </td>
          </tr>
        );
      })}
    </DataTable>
  );
}

// ── Tab: Egg Pickup ──────────────────────────────────────────────────────────
function EggPickupTable({ cycles, onRowClick }: { cycles: any[]; onRowClick: (c: any) => void }) {
  const headers = ["Patient", "Protocol", "Cycle Day", "Scheduled Time", "Total Follicles", "Eggs Retrieved", "MII Oocytes", "Anaesthesia", "Embryologist", "Status"];
  return (
    <DataTable headers={headers} empty={cycles.length === 0}>
      {cycles.map((c) => {
        const r = c.retrieval || {};
        const done = r.eggsRetrieved !== null && r.eggsRetrieved !== undefined;
        return (
          <tr key={c.id} className="hover:bg-teal-50 cursor-pointer transition-colors" onClick={() => onRowClick(c)}>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Avatar name={c.patientName} />
                <div>
                  <p className="font-semibold text-slate-900 leading-tight">{c.patientName}</p>
                  <p className="text-[10px] text-slate-400">Age {c.age}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.protocol}</td>
            <td className="px-4 py-3 font-medium whitespace-nowrap">{c.cycleDay}</td>
            <td className="px-4 py-3 tabular-nums whitespace-nowrap text-slate-700">{r.scheduledAt ?? "—"}</td>
            <td className="px-4 py-3 font-bold text-center tabular-nums">{r.totalFollicles ?? "—"}</td>
            <td className="px-4 py-3 text-center tabular-nums">
              <span className={`font-bold ${done ? "text-teal-700" : "text-slate-400"}`}>
                {r.eggsRetrieved ?? "—"}
              </span>
            </td>
            <td className="px-4 py-3 text-center tabular-nums">
              <span className={`font-bold ${done ? "text-emerald-700" : "text-slate-400"}`}>
                {r.matureOocytes ?? "—"}
              </span>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-slate-600">{r.anaesthesia ?? "—"}</td>
            <td className="px-4 py-3 whitespace-nowrap text-slate-600">{r.embryologist ?? "—"}</td>
            <td className="px-4 py-3">
              <Pill label={done ? "OPU Complete" : "Scheduled"} variant={done ? "success" : "info"} />
            </td>
          </tr>
        );
      })}
    </DataTable>
  );
}

// ── Tab: Embryology ──────────────────────────────────────────────────────────
const EMBRYO_QUALITY: Record<string, string> = {
  Excellent: "text-emerald-700 font-bold",
  Good:      "text-teal-700 font-semibold",
  Fair:      "text-amber-600",
  Poor:      "text-red-500",
};

function EmbryologyTable({ cycles, onRowClick }: { cycles: any[]; onRowClick: (c: any) => void }) {
  const headers = ["Patient / Embryo ID", "Protocol", "Phase", "Method", "Oocytes → Fertilized", "Day 1", "Day 3", "Day 5", "Grade (D6)", "Quality"];
  return (
    <DataTable headers={headers} empty={cycles.length === 0}>
      {cycles.map((c) => {
        const e = c.embryology || { method: "—", oocytesInjected: "—", fertilized: "—", embryos: [] };
        return (
          <React.Fragment key={c.id}>
            <tr className="bg-slate-50 border-t-2 border-slate-200 cursor-pointer hover:bg-teal-50/50" onClick={() => onRowClick(c)}>
              <td className="px-4 py-2" colSpan={10}>
                <div className="flex items-center gap-2.5">
                  <Avatar name={c.patientName} />
                  <span className="font-bold text-slate-900">{c.patientName}</span>
                  <span className="text-[10px] text-slate-400">Age {c.age} · {c.cycleDay}</span>
                  <Pill label={e.method} variant="purple" />
                  <span className="ml-auto text-xs text-slate-500">
                    {e.oocytesInjected} injected → <span className="font-bold text-teal-700">{e.fertilized} fertilized</span>
                  </span>
                  <span className="text-[10px] font-bold text-teal-600 ml-2 uppercase tracking-widest hover:underline">Edit ✎</span>
                </div>
              </td>
            </tr>
            {e.embryos.map((emb: any) => (
              <tr key={`${c.id}-${emb.id}`} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2.5 pl-16 font-mono text-xs font-bold text-slate-700">{emb.id}</td>
                <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{c.protocol}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  <Pill label={(c.status || "").replace("_", " ")} variant="info" />
                </td>
                <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{e.method}</td>
                <td className="px-4 py-2.5 tabular-nums text-center">
                  {e.oocytesInjected} → <span className="font-bold text-teal-700">{e.fertilized}</span>
                </td>
                <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{emb.d1}</td>
                <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{emb.d3}</td>
                <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{emb.d5}</td>
                <td className="px-4 py-2.5 font-bold text-teal-700 whitespace-nowrap">{emb.d6}</td>
                <td className={`px-4 py-2.5 whitespace-nowrap ${EMBRYO_QUALITY[emb.status] ?? ""}`}>{emb.status}</td>
              </tr>
            ))}
          </React.Fragment>
        );
      })}
    </DataTable>
  );
}

// ── Tab: Freezing ────────────────────────────────────────────────────────────
function FreezingTable({ cycles, onRowClick }: { cycles: any[]; onRowClick: (c: any) => void }) {
  const headers = ["Patient", "Protocol", "Cycle Day", "Total Blastocysts", "Frozen", "Discarded", "Vitrification Date", "Storage Tank", "PGT Status"];
  return (
    <DataTable headers={headers} empty={cycles.length === 0}>
      {cycles.map((c) => {
        const f = c.freezing || {};
        return (
          <tr key={c.id} className="hover:bg-teal-50 cursor-pointer transition-colors" onClick={() => onRowClick(c)}>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Avatar name={c.patientName} />
                <div>
                  <p className="font-semibold text-slate-900 leading-tight">{c.patientName}</p>
                  <p className="text-[10px] text-slate-400">Age {c.age}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.protocol}</td>
            <td className="px-4 py-3 font-medium whitespace-nowrap">{c.cycleDay}</td>
            <td className="px-4 py-3 text-center font-bold text-indigo-700 tabular-nums">{f.totalBlastocysts ?? "—"}</td>
            <td className="px-4 py-3 text-center font-bold text-teal-700 tabular-nums">{f.frozen ?? "—"}</td>
            <td className="px-4 py-3 text-center font-bold text-red-500 tabular-nums">{f.discarded ?? "—"}</td>
            <td className="px-4 py-3 tabular-nums whitespace-nowrap text-slate-700">{f.vitrificationDate ?? "—"}</td>
            <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{f.storageTank ?? "—"}</td>
            <td className="px-4 py-3">
              <Pill label={f.pgtStatus ?? "Pending"} variant={(f.pgtStatus ?? "Pending").includes("Pending") ? "warn" : "success"} />
            </td>
          </tr>
        );
      })}
    </DataTable>
  );
}

// ── Tab: Transfer ────────────────────────────────────────────────────────────
function TransferTable({ cycles, onRowClick }: { cycles: any[]; onRowClick: (c: any) => void }) {
  const headers = ["Patient", "Protocol", "Scheduled Time", "Endometrium", "Embryo Grade", "# Embryos", "Catheter", "Luteal Support", "Status"];
  return (
    <DataTable headers={headers} empty={cycles.length === 0}>
      {cycles.map((c) => {
        const t = c.transfer || {};
        return (
          <tr key={c.id} className="hover:bg-teal-50 cursor-pointer transition-colors" onClick={() => onRowClick(c)}>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Avatar name={c.patientName} />
                <div>
                  <p className="font-semibold text-slate-900 leading-tight">{c.patientName}</p>
                  <p className="text-[10px] text-slate-400">Age {c.age}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.protocol}</td>
            <td className="px-4 py-3 tabular-nums whitespace-nowrap text-slate-700">{t.scheduledAt ?? "—"}</td>
            <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{t.endometriumThickness ?? "—"}</td>
            <td className="px-4 py-3 font-bold text-teal-700 whitespace-nowrap">{t.embryoGrade ?? "—"}</td>
            <td className="px-4 py-3 text-center tabular-nums font-semibold">{t.embryosToTransfer ?? "—"}</td>
            <td className="px-4 py-3 whitespace-nowrap text-slate-600">{t.catheter ?? "—"}</td>
            <td className="px-4 py-3 text-slate-600 max-w-[220px] truncate" title={t.lutealSupport}>
              {t.lutealSupport ?? "—"}
            </td>
            <td className="px-4 py-3">
              <Pill label="ET Scheduled" variant="info" />
            </td>
          </tr>
        );
      })}
    </DataTable>
  );
}

// ── Tab: Outcome ─────────────────────────────────────────────────────────────
function OutcomeTable({ cycles, onRowClick }: { cycles: any[]; onRowClick: (c: any) => void }) {
  const headers = ["Patient", "Protocol", "DPT", "β-HCG Date", "β-HCG (mIU/mL)", "Previous β-HCG", "Trend", "Ultrasound Date", "Result"];
  return (
    <DataTable headers={headers} empty={cycles.length === 0}>
      {cycles.map((c) => {
        const o = c.outcome || {};
        const isPositive = o.result === "Positive";
        const isAwaiting = o.result === "Awaiting" || !o.result;
        let trend: React.ReactNode = <span className="text-slate-400">—</span>;
        if (isPositive && o.previousBeta && o.betaHCG) {
          const ratio = (o.betaHCG / o.previousBeta).toFixed(1);
          trend = (
            <span className="text-emerald-700 font-bold tabular-nums">↑ ×{ratio}</span>
          );
        }
        return (
          <tr key={c.id} className="hover:bg-teal-50 cursor-pointer transition-colors" onClick={() => onRowClick(c)}>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Avatar name={c.patientName} />
                <div>
                  <p className="font-semibold text-slate-900 leading-tight">{c.patientName}</p>
                  <p className="text-[10px] text-slate-400">Age {c.age}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.protocol}</td>
            <td className="px-4 py-3 font-medium whitespace-nowrap">{c.cycleDay}</td>
            <td className="px-4 py-3 tabular-nums whitespace-nowrap text-slate-700">{o.betaHCGDate ?? "—"}</td>
            <td className="px-4 py-3 text-center tabular-nums">
              <span className={`text-base font-black ${isAwaiting ? "text-slate-400" : isPositive ? "text-emerald-700" : "text-red-600"}`}>
                {o.betaHCG ?? "—"}
              </span>
            </td>
            <td className="px-4 py-3 text-center tabular-nums text-slate-500 font-medium">{o.previousBeta ?? "—"}</td>
            <td className="px-4 py-3 whitespace-nowrap">{trend}</td>
            <td className="px-4 py-3 tabular-nums whitespace-nowrap text-slate-500">{o.ultrasoundDate ?? "—"}</td>
            <td className="px-4 py-3">
              <Pill
                label={o.result ?? "Awaiting"}
                variant={isPositive ? "pulse-green" : isAwaiting ? "neutral" : "danger"}
              />
            </td>
          </tr>
        );
      })}
    </DataTable>
  );
}

// ── Slide-over Panel ─────────────────────────────────────────────────────────
function DataEntryPanel({
  cycle,
  activeTab,
  onClose,
  onSave,
}: {
  cycle: any;
  activeTab: TabKey;
  onClose: () => void;
  onSave: (updatedCycle: any) => void;
}) {
  const [formData, setFormData] = useState<any>(null);
  const [downloadingReport, setDownloadingReport] = useState(false);

  useEffect(() => {
    if (!cycle) return;
    // Deep clone the cycle to avoid mutating state directly
    setFormData(JSON.parse(JSON.stringify(cycle)));
  }, [cycle]);

  if (!cycle || !formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleDownloadCycleReport = async () => {
    try {
      setDownloadingReport(true);
      const res = await fetch("/api/hospital-settings/default");
      const { data: settings } = await res.json();
      generateCycleReportPDF(settings, formData);
    } catch (err) {
      console.error("Cycle PDF error:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloadingReport(false);
    }
  };

  const handleDeepChange = (path: string[], value: any) => {
    setFormData((prev: any) => {
      const next = { ...prev };
      let curr = next;
      for (let i = 0; i < path.length - 1; i++) {
        if (!curr[path[i]]) curr[path[i]] = {};
        curr = curr[path[i]];
      }
      curr[path[path.length - 1]] = value;
      return next;
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 border-l border-slate-200">
        
        {/* Header */}
        <div className="border-b border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">Update Phase Data</h2>
              <p className="text-xs text-slate-500">{cycle.patientName} • {cycle.protocol} • {cycle.cycleDay}</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
              ✕
            </button>
          </div>
          {/* Download Cycle Report Button */}
          <div className="px-6 pb-4">
            <button
              type="button"
              onClick={handleDownloadCycleReport}
              disabled={downloadingReport}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-bold text-teal-700 hover:bg-teal-100 transition-colors disabled:opacity-50"
            >
              {downloadingReport ? (
                <><span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" /> Generating PDF…</>
              ) : (
                <>⬇ Download Cycle Report PDF</>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <form id="data-entry-form" onSubmit={handleSubmit} className="space-y-6">
            
            {activeTab === "stimulation" && (
              <>
                <div className="bg-teal-50 rounded-xl p-4 border border-teal-100 mb-6">
                  <p className="text-sm font-bold text-teal-800 mb-1">Add Today's Log</p>
                  <p className="text-xs text-teal-600">This will append new values to the patient's trend charts.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Estradiol (E2) - pg/mL</label>
                  <input type="number" className="w-full rounded-lg border-slate-200 p-2.5 text-sm focus:ring-teal-500" placeholder="e.g. 1500" 
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val) {
                        const newE2 = [...(formData.stimulation?.e2 || []), val];
                        handleDeepChange(["stimulation", "e2"], newE2);
                      }
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">LH - mIU/mL</label>
                  <input type="number" className="w-full rounded-lg border-slate-200 p-2.5 text-sm focus:ring-teal-500" placeholder="e.g. 4.2" 
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (val) handleDeepChange(["stimulation", "lh"], [...(formData.stimulation?.lh || []), val]);
                    }}
                  />
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <input type="checkbox" id="trigger" className="rounded text-teal-600 focus:ring-teal-500" 
                    checked={formData.stimulation?.triggerReady || false}
                    onChange={(e) => handleDeepChange(["stimulation", "triggerReady"], e.target.checked)}
                  />
                  <label htmlFor="trigger" className="text-sm font-bold text-slate-700">Mark as Trigger Ready</label>
                </div>
              </>
            )}

            {activeTab === "outcome" && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">β-HCG Level (mIU/mL)</label>
                  <input type="number" className="w-full rounded-lg border-slate-200 p-2.5 text-sm focus:ring-teal-500" 
                    value={formData.outcome?.betaHCG || ""}
                    onChange={(e) => handleDeepChange(["outcome", "betaHCG"], Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Result</label>
                  <select className="w-full rounded-lg border-slate-200 p-2.5 text-sm focus:ring-teal-500"
                    value={formData.outcome?.result || "Awaiting"}
                    onChange={(e) => handleDeepChange(["outcome", "result"], e.target.value)}
                  >
                    <option value="Awaiting">Awaiting</option>
                    <option value="Positive">Positive</option>
                    <option value="Negative">Negative</option>
                  </select>
                </div>
              </>
            )}

            {activeTab === "egg_pickup" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Total Follicles</label>
                    <input type="number" className="w-full rounded-lg border-slate-200 p-2.5 text-sm focus:ring-teal-500" 
                      value={formData.retrieval?.totalFollicles || ""}
                      onChange={(e) => handleDeepChange(["retrieval", "totalFollicles"], Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Eggs Retrieved</label>
                    <input type="number" className="w-full rounded-lg border-slate-200 p-2.5 text-sm focus:ring-teal-500" 
                      value={formData.retrieval?.eggsRetrieved || ""}
                      onChange={(e) => handleDeepChange(["retrieval", "eggsRetrieved"], Number(e.target.value))}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Fallback for other tabs - simple text to show it works */}
            {!["stimulation", "outcome", "egg_pickup"].includes(activeTab) && (
              <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                <p className="text-3xl mb-3">🛠️</p>
                <p className="text-sm font-bold text-slate-700">Form Builder</p>
                <p className="text-xs text-slate-500 mt-1">Fields for {activeTab} can be mapped here similarly to Stimulation and Outcome.</p>
              </div>
            )}
            
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
          <button onClick={onClose} type="button" className="px-5 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button form="data-entry-form" type="submit" className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-teal-700 hover:bg-teal-800 shadow-md shadow-teal-700/20 transition-all">
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}


// ── Page ──────────────────────────────────────────────────────────────────────
export default function DoctorCycleMonitoringPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("stimulation");
  const [localCycles, setLocalCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCycle, setEditingCycle] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/doctor/cycles");
        if (res.ok) {
          const json = await res.json();
          const apiCycles = json.data || [];
          
          // Initialize local state with API + Mock data combined
          const allCycles = [
            ...apiCycles.map((c: any) => ({
              ...c,
              patientName: c.patient_id,
              age: 0,
              cycleDay: "—",
            })),
            ...mockCycles,
          ];
          setLocalCycles(allCycles);
        }
      } catch (_) {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  const tab = TABS.find((t) => t.key === activeTab)!;

  const filtered = localCycles.filter((c) =>
    (tab.statuses as unknown as string[]).includes(c.status as string)
  );

  const counts: Record<string, number> = {};
  for (const t of TABS) {
    counts[t.key] = localCycles.filter((c) =>
      (t.statuses as unknown as string[]).includes(c.status as string)
    ).length;
  }

  const phaseDesc: Record<TabKey, string> = {
    investigation: "Patients in PLANNING — reviewing baseline investigations before stimulation starts.",
    stimulation:   "Patients on gonadotropin stimulation — tracking follicle growth and hormone response daily.",
    egg_pickup:    "Patients scheduled for or who have completed oocyte retrieval (OPU).",
    embryology:    "Cycles in fertilization or embryo culture — monitoring fertilization rates and cleavage stages.",
    freezing:      "Embryos undergoing vitrification — cryo-banking blastocysts for future transfer.",
    transfer:      "Patients scheduled for embryo transfer — reviewing endometrial receptivity and luteal support.",
    outcome:       "Post-transfer patients awaiting or receiving beta-HCG results to confirm pregnancy.",
  };

  const handleSaveCycle = (updatedCycle: any) => {
    setLocalCycles((prev) => prev.map((c) => (c.id === updatedCycle.id ? updatedCycle : c)));
    setEditingCycle(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Slide-over panel */}
      {editingCycle && (
        <DataEntryPanel 
          cycle={editingCycle} 
          activeTab={activeTab} 
          onClose={() => setEditingCycle(null)} 
          onSave={handleSaveCycle} 
        />
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Cycle Monitoring Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? "Loading cycles…" : `${localCycles.length} active cycles across all phases`}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-bold text-teal-700 border border-teal-100">
          <span className="size-2 rounded-full bg-teal-500 animate-pulse" />
          Live · {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="overflow-x-auto">
        <div className="flex gap-1.5 min-w-max border-b border-slate-200 pb-0">
          {TABS.map((t) => {
            const active = t.key === activeTab;
            const count = counts[t.key] ?? 0;
            return (
              <button
                key={t.key}
                id={`tab-${t.key}`}
                onClick={() => setActiveTab(t.key)}
                className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all duration-150 whitespace-nowrap rounded-t-lg border-b-2 ${
                  active
                    ? "border-teal-600 text-teal-700 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black tabular-nums ${
                  active ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-400"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Phase context bar ── */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
        <span className="text-xl">{tab.icon}</span>
        <div className="flex-1">
          <span className="font-bold text-slate-900">{tab.label} </span>
          <span className="text-xs text-slate-500">{phaseDesc[activeTab]}</span>
        </div>
        <div className="shrink-0 rounded-lg bg-slate-50 px-4 py-1.5 text-right border border-slate-100">
          <span className="text-lg font-black text-slate-900">{filtered.length}</span>
          <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">patients</span>
        </div>
      </div>

      {/* ── Table area ── */}
      {loading && (
        <div className="h-64 animate-pulse rounded-xl bg-white border border-slate-200" />
      )}

      {!loading && (
        <>
          {tab.key === "investigation" && <InvestigationTable cycles={filtered} onRowClick={setEditingCycle} />}
          {tab.key === "stimulation"   && <StimulationTable   cycles={filtered} onRowClick={setEditingCycle} />}
          {tab.key === "egg_pickup"    && <EggPickupTable     cycles={filtered} onRowClick={setEditingCycle} />}
          {tab.key === "embryology"    && <EmbryologyTable    cycles={filtered} onRowClick={setEditingCycle} />}
          {tab.key === "freezing"      && <FreezingTable      cycles={filtered} onRowClick={setEditingCycle} />}
          {tab.key === "transfer"      && <TransferTable      cycles={filtered} onRowClick={setEditingCycle} />}
          {tab.key === "outcome"       && <OutcomeTable       cycles={filtered} onRowClick={setEditingCycle} />}
        </>
      )}
    </div>
  );
}
