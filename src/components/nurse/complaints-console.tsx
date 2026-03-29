"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

import { StatusBadge } from "@/components/patient/status-badge";
import { nurseComplaints } from "@/lib/mock-nurse-data";

export function ComplaintsConsole() {
  const [selectedId, setSelectedId] = useState<string>(nurseComplaints[0].id);
  const [panelOpen, setPanelOpen] = useState(true);

  const selected = useMemo(
    () => nurseComplaints.find((c) => c.id === selectedId) ?? nurseComplaints[0],
    [selectedId]
  );

  return (
    <div className="flex min-h-[680px] gap-5 overflow-hidden">
      <section className="flex-1 overflow-hidden rounded-xl bg-slate-100">
        <div className="grid grid-cols-12 bg-slate-200 px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-600">
          <div className="col-span-3">Patient Name</div>
          <div className="col-span-1">ID</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Severity</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Status</div>
        </div>

        <div className="max-h-[620px] overflow-y-auto bg-white">
          {nurseComplaints.map((row) => (
            <button
              key={row.id}
              onClick={() => {
                setSelectedId(row.id);
                setPanelOpen(true);
              }}
              className={`grid w-full grid-cols-12 items-center border-b px-6 py-4 text-left hover:bg-slate-50 ${
                selectedId === row.id ? "border-l-4 border-l-[#1A237E] bg-slate-50" : ""
              }`}
            >
              <div className="col-span-3">
                <p className="text-sm font-bold text-slate-900">{row.patient}</p>
              </div>
              <div className="col-span-1 text-xs text-slate-500">{row.patientId}</div>
              <div className="col-span-2 text-xs font-semibold text-slate-700">
                {row.category}
              </div>
              <div className="col-span-2">
                <StatusBadge
                  label={row.severity}
                  tone={
                    row.severity === "Critical"
                      ? "danger"
                      : row.severity === "Medium"
                        ? "warning"
                        : "neutral"
                  }
                />
              </div>
              <div className="col-span-2 text-xs text-slate-600">{row.dateReported}</div>
              <div className="col-span-2">
                <StatusBadge
                  label={row.status}
                  tone={row.status === "Unresolved" ? "danger" : row.status === "Resolved" ? "success" : "warning"}
                />
              </div>
            </button>
          ))}
        </div>
      </section>

      <aside
        className={`relative w-[430px] shrink-0 rounded-xl border border-slate-200 bg-white shadow-xl transition-transform duration-300 ${
          panelOpen ? "translate-x-0" : "translate-x-[120%]"
        }`}
      >
        <div className="flex items-start justify-between border-b p-5">
          <div>
            <StatusBadge label="High Priority Ticket" tone="danger" />
            <h3 className="mt-2 text-xl font-bold text-[#1A237E]">{selected.patient}</h3>
            <p className="text-xs text-slate-500">Case ID: {selected.id}</p>
          </div>
          <button onClick={() => setPanelOpen(false)} className="rounded p-1 hover:bg-slate-100">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-lg bg-slate-100 p-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Original Complaint
            </p>
            <p className="text-sm leading-relaxed text-slate-700">{selected.complaint}</p>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Assign to Specialist
            </label>
            <select className="w-full rounded-lg bg-slate-100 p-3 text-sm">
              <option>Dr. Julian Vance (Reproductive Endo)</option>
              <option>Dr. Sarah Mitchel (Nurse Practitioner)</option>
              <option>Pharmacy Inventory Manager</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Internal Staff Notes
            </label>
            <textarea
              className="w-full rounded-lg border-l-4 border-[#5c1800] bg-[#ffdbd0]/30 p-3 text-sm"
              rows={3}
              placeholder="Visible to staff only"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Response to Patient
            </label>
            <textarea
              className="w-full rounded-lg bg-slate-100 p-3 text-sm"
              rows={4}
              placeholder="Type official patient correspondence..."
            />
          </div>

          <div className="flex gap-3 border-t pt-4">
            <button className="flex-1 rounded-lg bg-[#1A237E] py-3 text-sm font-bold text-white hover:bg-[#111a63]">
              Send Response
            </button>
            <button className="rounded-lg bg-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-300">
              Archive
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
