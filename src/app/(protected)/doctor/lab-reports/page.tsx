"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/patient/status-badge";

export default function DoctorLabReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [annotation, setAnnotation] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/doctor/lab-reports");
      if (res.ok) {
        const json = await res.json();
        const data = json.data || [];
        setReports(data);
        if (data.length > 0 && !selected) {
          setSelected(data[0]);
          setAnnotation(data[0].interpretation || "");
        }
      }
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleSave = async (action: "approve" | "flag") => {
    if (!selected) return;
    const note = action === "flag"
      ? `[FLAGGED] ${annotation}`
      : annotation;
    try {
      setSaving(true);
      setSaveMsg(null);
      const res = await fetch("/api/doctor/lab-reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: selected.id, interpretation: note }),
      });
      if (res.ok) {
        setSaveMsg(action === "flag" ? "Report flagged." : "Report approved.");
        await fetchReports();
        setTimeout(() => setSaveMsg(null), 3000);
      }
    } catch (_) {}
    finally { setSaving(false); }
  };

  const selectReport = (r: any) => {
    setSelected(r);
    setAnnotation(r.interpretation || "");
    setSaveMsg(null);
  };

  const patientName = (r: any) =>
    r.patients ? `${r.patients.first_name} ${r.patients.last_name}` : r.patient_id?.slice(0, 8);

  return (
    <div className="space-y-6 bg-slate-50 text-slate-900">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Lab Reports</h2>
          <p className="text-sm text-slate-600">Review and annotate submitted lab results</p>
        </div>
        {!loading && (
          <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-700">
            {reports.length} Report{reports.length !== 1 ? "s" : ""}
          </span>
        )}
      </header>

      {loading && <p className="text-sm text-slate-500">Loading lab reports...</p>}

      {!loading && reports.length === 0 && (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm">
          <p className="text-slate-600">No lab reports submitted yet.</p>
          <p className="mt-1 text-xs text-slate-400">Nurses submit reports from the Lab Report Uploader.</p>
        </div>
      )}

      {!loading && reports.length > 0 && (
        <div className="flex flex-row gap-6">
          {/* Report list panel */}
          <section className="w-1/3 overflow-hidden rounded-lg border border-slate-300 bg-white">
            <div className="border-b border-slate-200 bg-slate-100 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-700">All Reports</p>
            </div>
            <div className="divide-y divide-slate-100">
              {reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => selectReport(r)}
                  className={`w-full px-4 py-4 text-left transition-colors hover:bg-slate-50 ${
                    selected?.id === r.id ? "bg-indigo-50 border-l-4 border-[#1A237E]" : ""
                  }`}
                >
                  <p className="text-sm font-bold text-slate-900">{patientName(r)}</p>
                  <p className="text-[11px] text-slate-500">{r.result_type}</p>
                  <p className="mt-1 text-[10px] font-mono text-slate-400">
                    {r.result_date ? new Date(r.result_date).toLocaleDateString() : "—"}
                  </p>
                  <div className="mt-1">
                    <StatusBadge
                      label={r.interpretation ? "Reviewed" : "Pending"}
                      tone={r.interpretation ? "success" : "warning"}
                    />
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Detail panel */}
          {selected && (
            <section className="w-2/3">
              <div className="h-full rounded-lg border border-slate-200 bg-white p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{selected.result_type}</h3>
                    <p className="text-sm text-slate-500">
                      Patient: {patientName(selected)} ·{" "}
                      {selected.result_date ? new Date(selected.result_date).toLocaleDateString() : ""}
                    </p>
                  </div>
                  <StatusBadge
                    label={selected.interpretation ? "Reviewed" : "Pending Review"}
                    tone={selected.interpretation ? "success" : "warning"}
                  />
                </div>

                {/* Parsed values */}
                <div>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-slate-700">
                    Result Values
                  </p>
                  {selected.result_data && typeof selected.result_data === "object" ? (
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          <tr>
                            <th className="px-4 py-3">Marker</th>
                            <th className="px-4 py-3">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {Object.entries(selected.result_data as Record<string, string>).map(([key, val]) => (
                            <tr key={key}>
                              <td className="px-4 py-3 font-semibold text-slate-800">{key}</td>
                              <td className="px-4 py-3 font-bold text-slate-900">{val as string}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No structured data available.</p>
                  )}
                </div>

                {/* Annotation + actions */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-8">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-700">
                        Annotation
                      </p>
                      <textarea
                        className="min-h-[100px] w-full rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400"
                        placeholder="Add review note, variance comment, or physician handoff details..."
                        value={annotation}
                        onChange={(e) => setAnnotation(e.target.value)}
                      />
                      {saveMsg && (
                        <p className="mt-1 text-xs font-semibold text-emerald-600">{saveMsg}</p>
                      )}
                    </div>
                    <div className="col-span-4 flex flex-col justify-end gap-3">
                      <Button
                        disabled={saving}
                        onClick={() => handleSave("flag")}
                        className="h-11 rounded-md bg-rose-600 text-white hover:bg-rose-500"
                      >
                        Flag
                      </Button>
                      <Button
                        disabled={saving}
                        onClick={() => handleSave("approve")}
                        className="h-11 rounded-md bg-teal-600 text-white hover:bg-teal-500"
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
