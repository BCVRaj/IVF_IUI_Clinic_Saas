"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { StatusBadge } from "@/components/patient/status-badge";
import { Button } from "@/components/ui/button";

const RESULT_TYPES = [
  "Hormone Panel",
  "Ultrasound",
  "Blood Work",
  "Embryo Assessment",
  "Semen Analysis",
  "Other",
];

const DEFAULT_MARKERS: Record<string, { label: string; unit: string }[]> = {
  "Hormone Panel": [
    { label: "Estradiol (E2)", unit: "pg/mL" },
    { label: "Progesterone (P4)", unit: "ng/mL" },
    { label: "LH", unit: "mIU/mL" },
    { label: "FSH", unit: "mIU/mL" },
  ],
  "Blood Work": [
    { label: "Hemoglobin", unit: "g/dL" },
    { label: "WBC", unit: "K/µL" },
    { label: "Platelets", unit: "K/µL" },
  ],
  Ultrasound: [
    { label: "Left Follicle Count", unit: "" },
    { label: "Right Follicle Count", unit: "" },
    { label: "Endometrial Thickness", unit: "mm" },
  ],
};

export default function NurseLabReportsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form state
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [resultType, setResultType] = useState("Hormone Panel");
  const [markerValues, setMarkerValues] = useState<Record<string, string>>({});
  const [interpretation, setInterpretation] = useState("");

  const fetchData = async () => {
    try {
      // Fetch nurse's assigned patients via existing assignments API
      const [assignRes, reportsRes] = await Promise.all([
        fetch("/api/nurse/medications"), // has patient list from nurse's assignments
        fetch("/api/nurse/lab-reports"),
      ]);

      if (assignRes.ok) {
        const json = await assignRes.json();
        // Extract unique patients from medications response
        const seen = new Set<string>();
        const pts: any[] = [];
        (json.data || []).forEach((m: any) => {
          if (m.patients && !seen.has(m.patient_id)) {
            seen.add(m.patient_id);
            pts.push({ id: m.patient_id, ...m.patients });
          }
        });
        setPatients(pts);
      }

      if (reportsRes.ok) {
        const json = await reportsRes.json();
        setReports(json.data || []);
      }
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const markers = DEFAULT_MARKERS[resultType] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      setSubmitError("Please select a patient.");
      return;
    }

    // Build results JSONB object
    const resultsObj: Record<string, string> = {};
    markers.forEach((m) => {
      if (markerValues[m.label]) {
        resultsObj[m.label] = `${markerValues[m.label]}${m.unit ? " " + m.unit : ""}`;
      }
    });

    if (Object.keys(resultsObj).length === 0) {
      setSubmitError("Please enter at least one result value.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);
      const res = await fetch("/api/nurse/lab-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          resultType,
          resultDate: new Date().toISOString().split("T")[0],
          results: resultsObj,
          interpretation: interpretation || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Submission failed");

      setMarkerValues({});
      setInterpretation("");
      setSelectedPatient(null);
      setPatientSearch("");
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      await fetchData();
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPatients = patients.filter((p) =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientSearch.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-extrabold tracking-tight text-[#000666]">
          Lab Report Uploader
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Submit diagnostics for physician review and protocol adjustment.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Form */}
        <article className="space-y-6 rounded-xl bg-slate-100 p-6 lg:col-span-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h3 className="mb-4 text-lg font-bold text-[#1A237E]">Patient Context</h3>

              {/* Patient selector */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-lg bg-white py-3 pl-10 pr-3 text-sm"
                  placeholder="Search assigned patients..."
                  value={selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setSelectedPatient(null);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                />
                {showDropdown && filteredPatients.length > 0 && !selectedPatient && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                    {filteredPatients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                        onMouseDown={() => {
                          setSelectedPatient(p);
                          setPatientSearch("");
                          setShowDropdown(false);
                        }}
                      >
                        {p.first_name} {p.last_name}
                        <span className="ml-2 text-[10px] text-slate-400">{p.id?.slice(0, 8)}</span>
                      </button>
                    ))}
                  </div>
                )}
                {patients.length === 0 && !loading && (
                  <p className="mt-1 text-xs text-slate-500">No patients assigned yet.</p>
                )}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-200 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Patient</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-200 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Test Type</p>
                  <select
                    className="w-full bg-transparent text-sm font-semibold text-slate-800"
                    value={resultType}
                    onChange={(e) => { setResultType(e.target.value); setMarkerValues({}); }}
                  >
                    {RESULT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Marker values */}
            {markers.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Enter Results</p>
                {markers.map((m) => (
                  <div key={m.label} className="flex items-center gap-3">
                    <label className="w-44 text-xs font-semibold text-slate-700">{m.label}</label>
                    <div className="flex flex-1 items-center gap-1">
                      <input
                        type="text"
                        className="flex-1 rounded-lg bg-white px-3 py-2 text-sm"
                        placeholder="Value"
                        value={markerValues[m.label] || ""}
                        onChange={(e) => setMarkerValues((prev) => ({ ...prev, [m.label]: e.target.value }))}
                      />
                      {m.unit && <span className="text-[10px] text-slate-400">{m.unit}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {resultType === "Other" && (
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Custom Notes</p>
                <textarea
                  rows={3}
                  className="w-full rounded-lg bg-white p-3 text-sm"
                  placeholder="Enter custom result notes..."
                  value={markerValues["notes"] || ""}
                  onChange={(e) => setMarkerValues({ notes: e.target.value })}
                />
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">Interpretation / Notes</p>
              <textarea
                rows={2}
                className="w-full resize-none rounded-lg bg-white p-3 text-sm"
                placeholder="Optional: clinical context, flags, observations..."
                value={interpretation}
                onChange={(e) => setInterpretation(e.target.value)}
              />
            </div>

            {submitError && (
              <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{submitError}</div>
            )}
            {submitSuccess && (
              <div className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                Lab report submitted successfully.
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#1A237E] hover:bg-[#111a63]"
            >
              {submitting ? "Submitting..." : "Submit Lab Report"}
            </Button>
          </form>
        </article>

        {/* Reports queue */}
        <article className="space-y-5 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#1A237E]">Submitted Reports</h2>
            <StatusBadge label={`${reports.length} Total`} tone={reports.length > 0 ? "success" : "neutral"} />
          </div>

          {loading && <p className="text-sm text-slate-500">Loading reports...</p>}

          {!loading && reports.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">No lab reports submitted yet.</p>
            </div>
          )}

          {!loading && reports.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full min-w-[560px] text-left">
                <thead className="bg-slate-100 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-4 py-4">Patient</th>
                    <th className="px-4 py-4">Type</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {reports.map((r: any) => {
                    const patient = r.patients;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-mono text-sm font-bold text-slate-800">
                          {r.result_date ? new Date(r.result_date).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                          {patient ? `${patient.first_name} ${patient.last_name}` : r.patient_id?.slice(0, 8)}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">{r.result_type}</td>
                        <td className="px-6 py-4">
                          <StatusBadge
                            label={r.interpretation ? "Reviewed" : "Pending Review"}
                            tone={r.interpretation ? "success" : "warning"}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="rounded-xl bg-[#1A237E] p-6 text-white">
            <h4 className="text-lg font-bold">Clinic Protocol Note</h4>
            <p className="mt-2 text-sm text-indigo-100">
              Ensure hormone panel results are forwarded directly to the nursing
              lead for dosage adjustments. STAT flags trigger physician alerts.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
