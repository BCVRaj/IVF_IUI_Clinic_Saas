"use client";

import { useMemo, useState } from "react";
import { X, AlertCircle } from "lucide-react";

import { StatusBadge } from "@/components/patient/status-badge";
import { nurseComplaints } from "@/lib/mock-nurse-data";
import { complaints as patientComplaints } from "@/lib/mock-patient-data";

interface ComplaintsConsoleProps {
  complaints?: any[];
}

export function ComplaintsConsole({ complaints: passedComplaints }: ComplaintsConsoleProps) {
  // Use passed complaints or merge mock data as fallback
  const mergedComplaints = useMemo(() => {
    if (passedComplaints && passedComplaints.length > 0) {
      // Format real complaints from API
      return passedComplaints.map((c) => ({
        ...c,
        id: c.id || c.patient_id,
        source: "Patient Submitted" as const,
        severity: c.severity || "Medium" as const,
        dateReported: c.created_at || new Date().toISOString(),
        complaint: c.description,
        patient: c.patients?.[0]?.first_name + " " + c.patients?.[0]?.last_name || "Unknown",
        patientName: c.patients?.[0]?.first_name + " " + c.patients?.[0]?.last_name || "Unknown",
        patientId: c.patient_id,
        category: c.category || "General",
      })).sort(
        (a, b) => new Date(b.dateReported).getTime() - new Date(a.dateReported).getTime()
      );
    }

    // Fallback to mock data
    const patientSubmitted = patientComplaints.map((c) => ({
      ...c,
      source: "Patient Submitted" as const,
      severity: c.severity || "Medium" as const,
      dateReported: c.datetime,
      complaint: c.description,
      patient: c.patientName,
      category: c.category || "General",
    }));
    return [...nurseComplaints, ...patientSubmitted].sort(
      (a, b) => new Date(b.dateReported).getTime() - new Date(a.dateReported).getTime()
    );
  }, [passedComplaints]);

  const [selectedId, setSelectedId] = useState<string>(mergedComplaints[0]?.id || "");
  const [panelOpen, setPanelOpen] = useState(true);

  const selected = useMemo(
    () => mergedComplaints.find((c) => c.id === selectedId) ?? mergedComplaints[0],
    [selectedId, mergedComplaints]
  );

  if (!selected) {
    return <div className="text-center py-8 text-slate-600">No complaints found.</div>;
  }

  return (
    <div className="flex min-h-[680px] gap-5 overflow-hidden">
      <section className="flex-1 overflow-hidden rounded-xl bg-surface-lowest shadow-[0_8px_32px_rgba(25,28,30,0.04)] backdrop-blur-md">
        <div className="grid grid-cols-12 bg-surface px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-surface-dim/30">
          <div className="col-span-3">Patient Name</div>
          <div className="col-span-1">ID</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Severity</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-2">Source</div>
        </div>

        <div className="max-h-[620px] overflow-y-auto">
          {mergedComplaints.map((row) => (
            <button
              key={row.id}
              onClick={() => {
                setSelectedId(row.id);
                setPanelOpen(true);
              }}
              className={`grid w-full grid-cols-12 items-center border-b border-surface-low px-6 py-4 text-left hover:bg-surface transition-colors duration-200 ${
                selectedId === row.id ? "border-l-4 border-l-primary bg-surface" : ""
              }`}
            >
              <div className="col-span-3">
                <p className="text-sm font-bold text-on-surface">
                  {(row as any).patient || (row as any).patientName}
                </p>
              </div>
              <div className="col-span-1 text-xs text-on-surface-variant">
                {(row as any).patientId}
              </div>
              <div className="col-span-2 text-xs font-semibold text-on-surface-variant">
                {(row as any).category || "General"}
              </div>
              <div className="col-span-2">
                <StatusBadge
                  label={(row as any).severity || "Medium"}
                  tone={
                    (row as any).severity === "Critical"
                      ? "danger"
                      : (row as any).severity === "Medium"
                        ? "warning"
                        : "neutral"
                  }
                />
              </div>
              <div className="col-span-2 text-xs text-on-surface-variant">
                {(row as any).dateReported}
              </div>
              <div className="col-span-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  (row as any).source === "Patient Submitted"
                    ? "bg-secondary/20 text-secondary"
                    : "bg-primary/20 text-primary"
                }`}>
                  {(row as any).source || "Nurse"}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <aside
        className={`relative w-[430px] shrink-0 rounded-xl bg-surface-lowest shadow-xl transition-transform duration-300 backdrop-blur-md border border-surface-dim/50 ${
          panelOpen ? "translate-x-0" : "translate-x-[120%]"
        }`}
      >
        <div className="flex items-start justify-between border-b border-surface-low p-5">
          <div>
            <StatusBadge 
              label={(selected as any).source === "Patient Submitted" ? "Patient Report" : "Nurse Report"} 
              tone={(selected as any).severity === "Critical" ? "danger" : "warning"} 
            />
            <h3 className="mt-2 text-xl font-bold text-on-surface">
              {(selected as any).patient || (selected as any).patientName}
            </h3>
            <p className="text-xs text-on-surface-variant">Case ID: {selected.id}</p>
            {(selected as any).source && (
              <p className="text-xs text-on-surface-variant mt-1">
                Source: {(selected as any).source}
              </p>
            )}
          </div>
          <button onClick={() => setPanelOpen(false)} className="rounded p-1 hover:bg-surface">
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-lg bg-surface p-4 border-l-4 border-primary">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
              {(selected as any).source === "Patient Submitted" ? "Patient Report" : "Original Complaint"}
            </p>
            <p className="text-sm leading-relaxed text-on-surface">
              {(selected as any).complaint}
            </p>
          </div>

          {(selected as any).source === "Patient Submitted" && (
            <div className="rounded-lg bg-secondary/10 p-4 border-l-4 border-secondary flex gap-2">
              <AlertCircle className="size-4 text-secondary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-1">Action Required</p>
                <p className="text-xs text-on-surface">This complaint was submitted by the patient and requires acknowledgment and follow-up.</p>
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
              Assign to Specialist
            </label>
            <select className="w-full rounded-lg bg-surface border border-surface-dim/50 p-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Dr. Julian Vance (Reproductive Endo)</option>
              <option>Dr. Sarah Mitchel (Nurse Practitioner)</option>
              <option>Pharmacy Inventory Manager</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
              Internal Staff Notes
            </label>
            <textarea
              className="w-full rounded-lg border-l-4 border-error bg-error/10 p-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              placeholder="Visible to staff only"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
              Response to Patient
            </label>
            <textarea
              className="w-full rounded-lg bg-surface border border-surface-dim/50 p-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
              placeholder="Type official patient correspondence..."
            />
          </div>

          <div className="flex gap-3 border-t border-surface-low pt-4">
            <button className="flex-1 rounded-lg bg-primary text-primary-foreground py-3 text-sm font-bold hover:opacity-90 shadow-sm">
              Send Response
            </button>
            <button className="rounded-lg bg-surface border border-surface-dim/50 px-4 py-3 text-sm font-bold text-on-surface hover:bg-surface-low">
              Archive
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
