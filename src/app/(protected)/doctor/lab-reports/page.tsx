"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/patient/status-badge";
import { generateLabReportPDF } from "@/lib/pdf-generator";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Report {
  id: string;
  patient_id: string;
  result_type: string;
  result_date: string | null;
  result_data: Record<string, unknown> | null;
  interpretation: string | null;
  created_at: string;
  patients?: { id: string; first_name: string; last_name: string; date_of_birth?: string };
}

interface PatientGroup {
  id: string;
  name: string;
  dob?: string;
  reportCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function patientDisplayName(r: Report) {
  if (r.patients) return `${r.patients.first_name} ${r.patients.last_name}`;
  return r.patient_id?.slice(0, 8) ?? "Unknown";
}

function buildPatientList(reports: Report[]): PatientGroup[] {
  const map = new Map<string, PatientGroup>();
  for (const r of reports) {
    if (!map.has(r.patient_id)) {
      map.set(r.patient_id, {
        id: r.patient_id,
        name: patientDisplayName(r),
        dob: r.patients?.date_of_birth,
        reportCount: 0,
      });
    }
    map.get(r.patient_id)!.reportCount += 1;
  }
  return Array.from(map.values());
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DoctorLabReportsPage() {
  // Raw data
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // 3-column state
  const [patients, setPatients] = useState<PatientGroup[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientGroup | null>(null);
  const [patientReports, setPatientReports] = useState<Report[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  // Right panel: "download" or "detail" (annotation / approve / flag)
  const [rightPanel, setRightPanel] = useState<"download" | "detail">("download");
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [annotation, setAnnotation] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // ── Fetch all reports once ──────────────────────────────────────────────────
  const fetchReports = async () => {
    try {
      const res = await fetch("/api/doctor/lab-reports");
      if (res.ok) {
        const json = await res.json();
        const data: Report[] = json.data || [];
        setReports(data);
        const grouped = buildPatientList(data);
        setPatients(grouped);
        // Auto-select first patient
        if (grouped.length > 0) {
          selectPatient(grouped[0], data);
        }
      }
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  // ── Patient selection ───────────────────────────────────────────────────────
  const selectPatient = (p: PatientGroup, allReports: Report[] = reports) => {
    setSelectedPatient(p);
    const pReports = allReports.filter((r) => r.patient_id === p.id);
    setPatientReports(pReports);
    setCheckedIds(new Set()); // reset checkboxes
    setRightPanel("download");
    setActiveReport(null);
    setSaveMsg(null);
  };

  // ── Checkbox toggle ─────────────────────────────────────────────────────────
  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (checkedIds.size === patientReports.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(patientReports.map((r) => r.id)));
    }
  };

  // ── Open detail / annotation panel ─────────────────────────────────────────
  const openDetail = (r: Report) => {
    setActiveReport(r);
    setAnnotation(r.interpretation || "");
    setSaveMsg(null);
    setRightPanel("detail");
  };

  // ── Save annotation ─────────────────────────────────────────────────────────
  const handleSave = async (action: "approve" | "flag") => {
    if (!activeReport) return;
    const note = action === "flag" ? `[FLAGGED] ${annotation}` : annotation;
    try {
      setSaving(true);
      setSaveMsg(null);
      const res = await fetch("/api/doctor/lab-reports", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: activeReport.id, interpretation: note }),
      });
      if (res.ok) {
        setSaveMsg(action === "flag" ? "Report flagged." : "Report approved.");
        await fetchReports();
        setTimeout(() => setSaveMsg(null), 3000);
      }
    } catch (_) {}
    finally { setSaving(false); }
  };

  // ── PDF download ────────────────────────────────────────────────────────────
  const handleDownloadPdf = async (mode: "selected" | "full") => {
    if (!selectedPatient) return;
    const reportsToDownload =
      mode === "full"
        ? patientReports
        : patientReports.filter((r) => checkedIds.has(r.id));

    if (reportsToDownload.length === 0) {
      alert("Please select at least one report to download.");
      return;
    }

    try {
      setDownloadingPdf(true);
      const res = await fetch("/api/hospital-settings/default");
      if (!res.ok) throw new Error("Failed to load hospital settings");
      const { data: settings } = await res.json();

      const patientInfo = {
        name: selectedPatient.name,
        age: "N/A",
        dob: selectedPatient.dob
          ? new Date(selectedPatient.dob).toLocaleDateString()
          : "N/A",
        patientId: selectedPatient.id,
      };

      generateLabReportPDF(settings, patientInfo, reportsToDownload, mode);
    } catch (err) {
      console.error("PDF Error:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 bg-slate-50 min-h-screen pb-10 text-slate-900">
      {/* Page Header */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Lab Reports</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Select a patient, choose reports, and download a structured PDF
          </p>
        </div>
        {!loading && (
          <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-700">
            {reports.length} Report{reports.length !== 1 ? "s" : ""}
          </span>
        )}
      </header>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
          Loading lab reports…
        </div>
      )}

      {/* Empty */}
      {!loading && reports.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-16 text-center">
          <p className="text-2xl">🔬</p>
          <p className="mt-2 font-semibold text-slate-700">No lab reports submitted yet.</p>
          <p className="mt-1 text-xs text-slate-400">
            Nurses submit reports from the Lab Report Uploader.
          </p>
        </div>
      )}

      {/* 3-Column Layout */}
      {!loading && reports.length > 0 && (
        <div className="grid grid-cols-[220px_1fr_320px] gap-4 h-[calc(100vh-180px)]">

          {/* ── Column 1: Patient List ────────────────────────────────────── */}
          <aside className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Patients ({patients.length})
              </p>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {patients.map((p) => {
                const isActive = selectedPatient?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => selectPatient(p)}
                    className={`w-full text-left px-4 py-4 transition-all hover:bg-slate-50 ${
                      isActive
                        ? "bg-indigo-50 border-l-4 border-indigo-600"
                        : "border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className={`text-sm font-bold leading-tight ${isActive ? "text-indigo-900" : "text-slate-800"}`}>
                        {p.name}
                      </p>
                      <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive ? "bg-indigo-200 text-indigo-800" : "bg-slate-100 text-slate-500"
                      }`}>
                        {p.reportCount}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{p.id.slice(0, 12)}…</p>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ── Column 2: Reports for Selected Patient ───────────────────── */}
          <section className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                {selectedPatient
                  ? `${patientReports.length} Report${patientReports.length !== 1 ? "s" : ""} · ${selectedPatient.name}`
                  : "Select a patient"}
              </p>
              {patientReports.length > 0 && (
                <button
                  onClick={toggleAll}
                  className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  {checkedIds.size === patientReports.length ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {!selectedPatient && (
                <div className="flex flex-col items-center justify-center h-full text-center p-10">
                  <p className="text-3xl">👈</p>
                  <p className="mt-2 text-sm text-slate-500">Select a patient to see their reports</p>
                </div>
              )}
              {selectedPatient && patientReports.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center p-10">
                  <p className="text-3xl">📋</p>
                  <p className="mt-2 text-sm text-slate-500">No reports found for this patient</p>
                </div>
              )}
              {patientReports.map((r) => {
                const isChecked = checkedIds.has(r.id);
                const isActive = activeReport?.id === r.id && rightPanel === "detail";
                return (
                  <div
                    key={r.id}
                    className={`flex items-start gap-3 px-4 py-4 transition-all hover:bg-slate-50 ${
                      isActive ? "bg-indigo-50 border-l-4 border-indigo-500" : "border-l-4 border-transparent"
                    }`}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCheck(r.id)}
                      className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-indigo-600"
                    />
                    {/* Info — clicking opens detail panel */}
                    <button
                      className="flex-1 text-left"
                      onClick={() => openDetail(r)}
                    >
                      <p className="text-sm font-bold text-slate-900 leading-tight">{r.result_type}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {r.result_date
                          ? new Date(r.result_date).toLocaleDateString("en-IN", {
                              day: "2-digit", month: "short", year: "numeric",
                            })
                          : "Date N/A"}
                      </p>
                      <div className="mt-1.5">
                        <StatusBadge
                          label={r.interpretation ? "Reviewed" : "Pending"}
                          tone={r.interpretation ? "success" : "warning"}
                        />
                      </div>
                    </button>
                    {/* Arrow icon hint */}
                    <span className="text-slate-300 mt-1 text-xs">›</span>
                  </div>
                );
              })}
            </div>

            {/* Bottom: selection summary */}
            {selectedPatient && patientReports.length > 0 && (
              <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 flex items-center gap-2">
                <span className="text-[11px] text-slate-500">
                  {checkedIds.size === 0
                    ? "No reports checked — click checkboxes to select"
                    : `${checkedIds.size} of ${patientReports.length} selected for download`}
                </span>
              </div>
            )}
          </section>

          {/* ── Column 3: Right Panel (Download or Detail) ───────────────── */}
          <aside className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            {/* ── Download Panel ── */}
            {rightPanel === "download" && (
              <>
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    Download Center
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
                  {!selectedPatient ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <p className="text-3xl">⬇️</p>
                      <p className="mt-2 text-sm text-slate-500">
                        Select a patient first to configure your download
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Patient Card */}
                      <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1">
                          Selected Patient
                        </p>
                        <p className="text-base font-bold text-indigo-900">{selectedPatient.name}</p>
                        <p className="text-[11px] text-indigo-600 font-mono mt-0.5">{selectedPatient.id}</p>
                        {selectedPatient.dob && (
                          <p className="text-[11px] text-indigo-500 mt-0.5">
                            DOB: {new Date(selectedPatient.dob).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {/* Summary of checked reports */}
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                          Selected Reports ({checkedIds.size})
                        </p>
                        {checkedIds.size === 0 ? (
                          <p className="text-xs text-slate-400 italic">
                            No reports checked. Use checkboxes in the middle column to select reports to include.
                          </p>
                        ) : (
                          <ul className="space-y-1">
                            {patientReports
                              .filter((r) => checkedIds.has(r.id))
                              .map((r) => (
                                <li
                                  key={r.id}
                                  className="flex items-center gap-2 text-xs text-slate-700 rounded-md bg-slate-50 border border-slate-100 px-3 py-2"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                                  <span className="font-semibold">{r.result_type}</span>
                                  <span className="ml-auto text-slate-400">
                                    {r.result_date
                                      ? new Date(r.result_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                                      : "—"}
                                  </span>
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>

                      {/* Divider */}
                      <hr className="border-slate-200" />

                      {/* Download Buttons */}
                      <div className="flex flex-col gap-3">
                        <Button
                          disabled={downloadingPdf || checkedIds.size === 0}
                          onClick={() => handleDownloadPdf("selected")}
                          className="h-11 w-full rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 font-bold text-sm"
                        >
                          {downloadingPdf
                            ? "Generating PDF…"
                            : `⬇ Download Selected (${checkedIds.size})`}
                        </Button>
                        <Button
                          disabled={downloadingPdf || patientReports.length === 0}
                          onClick={() => handleDownloadPdf("full")}
                          variant="outline"
                          className="h-11 w-full rounded-lg border-teal-300 text-teal-700 hover:bg-teal-50 font-bold text-sm"
                        >
                          {downloadingPdf ? "Generating PDF…" : "⬇ Download Full Report"}
                        </Button>
                      </div>

                      <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                        PDFs include a medical header with hospital details, patient demographics, and structured result tables.
                      </p>
                    </>
                  )}
                </div>
              </>
            )}

            {/* ── Detail / Annotation Panel ── */}
            {rightPanel === "detail" && activeReport && (
              <>
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    Report Detail
                  </p>
                  <button
                    onClick={() => { setRightPanel("download"); setActiveReport(null); }}
                    className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    ← Back
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {/* Report header */}
                  <div className="rounded-lg bg-slate-50 border border-slate-100 p-4">
                    <h3 className="text-base font-bold text-slate-900">{activeReport.result_type}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {activeReport.result_date
                        ? new Date(activeReport.result_date).toLocaleDateString("en-IN", {
                            weekday: "long", day: "2-digit", month: "long", year: "numeric",
                          })
                        : "Date not recorded"}
                    </p>
                    <div className="mt-2">
                      <StatusBadge
                        label={activeReport.interpretation ? "Reviewed" : "Pending Review"}
                        tone={activeReport.interpretation ? "success" : "warning"}
                      />
                    </div>
                  </div>

                  {/* Result values */}
                  {activeReport.result_data && typeof activeReport.result_data === "object" ? (
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          <tr>
                            <th className="px-3 py-2">Marker</th>
                            <th className="px-3 py-2">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {Object.entries(activeReport.result_data as Record<string, string>).map(([key, val]) => (
                            <tr key={key}>
                              <td className="px-3 py-2 font-semibold text-slate-700 text-xs">{key}</td>
                              <td className="px-3 py-2 font-bold text-slate-900 text-xs">{val}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No structured data available.</p>
                  )}

                  {/* Annotation */}
                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-600">
                      Physician Annotation
                    </p>
                    <textarea
                      className="w-full min-h-[90px] rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      placeholder="Add review note, variance comment, or physician handoff details..."
                      value={annotation}
                      onChange={(e) => setAnnotation(e.target.value)}
                    />
                    {saveMsg && (
                      <p className="mt-1 text-xs font-semibold text-emerald-600">{saveMsg}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      disabled={saving}
                      onClick={() => handleSave("flag")}
                      className="flex-1 h-10 rounded-lg bg-rose-600 text-white hover:bg-rose-500 text-sm font-bold"
                    >
                      🚩 Flag
                    </Button>
                    <Button
                      disabled={saving}
                      onClick={() => handleSave("approve")}
                      className="flex-1 h-10 rounded-lg bg-teal-600 text-white hover:bg-teal-500 text-sm font-bold"
                    >
                      ✓ Approve
                    </Button>
                  </div>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
