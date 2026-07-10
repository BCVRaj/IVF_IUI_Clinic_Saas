"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Upload, X, FileText } from "lucide-react";

import { StatusBadge } from "@/components/patient/status-badge";
import { Button } from "@/components/ui/button";

// ─── Constants ────────────────────────────────────────────────────────────────
const RESULT_TYPES = [
  "Hormone Panel",
  "Ultrasound",
  "Blood Work",
  "Embryo Assessment",
  "Semen Analysis",
  "AMH & Ovarian Reserve",
  "Thyroid Function Test",
  "Infectious Disease Screening",
  "Other",
];

const DEFAULT_MARKERS: Record<string, { label: string; unit: string }[]> = {
  "Hormone Panel": [
    { label: "Estradiol (E2)", unit: "pg/mL" },
    { label: "Progesterone (P4)", unit: "ng/mL" },
    { label: "LH", unit: "mIU/mL" },
    { label: "FSH", unit: "mIU/mL" },
    { label: "AMH", unit: "ng/mL" },
  ],
  "Blood Work": [
    { label: "Hemoglobin", unit: "g/dL" },
    { label: "WBC", unit: "K/µL" },
    { label: "Platelets", unit: "K/µL" },
    { label: "Hematocrit", unit: "%" },
  ],
  Ultrasound: [
    { label: "Left Follicle Count", unit: "" },
    { label: "Right Follicle Count", unit: "" },
    { label: "Endometrial Thickness", unit: "mm" },
    { label: "Lead Follicle Size", unit: "mm" },
  ],
  "AMH & Ovarian Reserve": [
    { label: "AMH", unit: "ng/mL" },
    { label: "AFC (Antral Follicle Count)", unit: "follicles" },
    { label: "FSH (Day 2)", unit: "mIU/mL" },
    { label: "Estradiol (E2)", unit: "pg/mL" },
  ],
  "Thyroid Function Test": [
    { label: "TSH", unit: "µIU/mL" },
    { label: "Free T3", unit: "pg/mL" },
    { label: "Free T4", unit: "ng/dL" },
    { label: "Anti-TPO Antibodies", unit: "IU/mL" },
  ],
  "Infectious Disease Screening": [
    { label: "HIV 1 & 2", unit: "" },
    { label: "Hepatitis B (HBsAg)", unit: "" },
    { label: "Hepatitis C (HCV)", unit: "" },
    { label: "Syphilis (VDRL/TPHA)", unit: "" },
    { label: "Rubella IgG", unit: "" },
  ],
  "Semen Analysis": [
    { label: "Volume", unit: "mL" },
    { label: "Concentration", unit: "million/mL" },
    { label: "Total Motility", unit: "%" },
    { label: "Progressive Motility", unit: "%" },
    { label: "Normal Morphology (Kruger)", unit: "%" },
  ],
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function NurseLabReportsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Patient selector state
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Form state
  const [resultType, setResultType] = useState("Hormone Panel");
  const [markerValues, setMarkerValues] = useState<Record<string, string>>({});
  const [interpretation, setInterpretation] = useState("");

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  // ── Fetch data ────────────────────────────────────────────────────────────
  const fetchData = async () => {
    try {
      const [patientsRes, reportsRes] = await Promise.all([
        fetch("/api/nurse/patients"),          // ✅ correct patients endpoint
        fetch("/api/nurse/lab-reports"),
      ]);

      if (patientsRes.ok) {
        const json = await patientsRes.json();
        setPatients(json.data || []);
      }

      if (reportsRes.ok) {
        const json = await reportsRes.json();
        setReports(json.data || []);
      }
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // ── File handling ─────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate: max 5MB, must be PDF or image
    if (file.size > 5 * 1024 * 1024) {
      setSubmitError("File must be under 5 MB.");
      return;
    }
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setSubmitError("Only PDF, JPG, PNG, or WEBP files are allowed.");
      return;
    }

    setSubmitError(null);
    setAttachedFile(file);

    // Show image preview; PDFs get a generic icon
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview("pdf");
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const markers = DEFAULT_MARKERS[resultType] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      setSubmitError("Please select a patient.");
      return;
    }

    // Build results JSONB object from marker inputs
    const resultsObj: Record<string, string> = {};
    markers.forEach((m) => {
      if (markerValues[m.label]) {
        resultsObj[m.label] = `${markerValues[m.label]}${m.unit ? " " + m.unit : ""}`;
      }
    });

    // For "Other" type free-text
    if (resultType === "Other" && markerValues["notes"]) {
      resultsObj["Notes"] = markerValues["notes"];
    }

    // Attach file as base64 if present
    let fileData: { name: string; type: string; base64: string } | null = null;
    if (attachedFile) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve((ev.target?.result as string).split(",")[1]);
        reader.readAsDataURL(attachedFile);
      });
      fileData = { name: attachedFile.name, type: attachedFile.type, base64 };
    }

    if (Object.keys(resultsObj).length === 0 && !fileData) {
      setSubmitError("Please enter at least one result value or attach a report file.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const payload = {
        patientId: selectedPatient.id,
        resultType,
        resultDate: new Date().toISOString().split("T")[0],
        results: {
          ...resultsObj,
          ...(fileData ? { _attachedFile: fileData } : {}),
        },
        interpretation: interpretation || null,
      };

      const res = await fetch("/api/nurse/lab-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Submission failed");

      // Reset form
      setMarkerValues({});
      setInterpretation("");
      setSelectedPatient(null);
      setPatientSearch("");
      removeFile();
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 4000);
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-extrabold tracking-tight text-[#000666]">
          Lab Report Uploader
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Submit diagnostics for physician review. Enter values manually, attach a file, or both.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">

        {/* ── Left: Form ── */}
        <article className="space-y-6 rounded-xl bg-slate-100 p-6 lg:col-span-5">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Patient Selector */}
            <div>
              <h3 className="mb-3 text-lg font-bold text-[#1A237E]">1. Select Patient</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-lg bg-white py-3 pl-10 pr-3 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  placeholder={loading ? "Loading patients…" : `Search ${patients.length} patients…`}
                  value={selectedPatient
                    ? `${selectedPatient.first_name} ${selectedPatient.last_name}`
                    : patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setSelectedPatient(null);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                />

                {/* Dropdown */}
                {showDropdown && !selectedPatient && (
                  <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
                    {filteredPatients.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-slate-400">
                        {loading ? "Loading…" : patientSearch ? "No patients match your search." : "No patients found in database."}
                      </p>
                    ) : (
                      filteredPatients.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-slate-50"
                          onMouseDown={() => {
                            setSelectedPatient(p);
                            setPatientSearch("");
                            setShowDropdown(false);
                          }}
                        >
                          <span className="font-semibold text-slate-800">
                            {p.first_name} {p.last_name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{p.id?.slice(0, 8)}…</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Selected patient card */}
              {selectedPatient && (
                <div className="mt-2 flex items-center justify-between rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-2.5">
                  <div>
                    <p className="text-sm font-bold text-indigo-900">
                      {selectedPatient.first_name} {selectedPatient.last_name}
                    </p>
                    <p className="text-[10px] text-indigo-500 font-mono">{selectedPatient.id}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedPatient(null); setPatientSearch(""); }}
                    className="text-indigo-400 hover:text-indigo-700 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Test Type */}
            <div>
              <h3 className="mb-3 text-lg font-bold text-[#1A237E]">2. Test Type</h3>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={resultType}
                onChange={(e) => { setResultType(e.target.value); setMarkerValues({}); }}
              >
                {RESULT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>

            {/* Marker Values */}
            {markers.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  3. Enter Results
                </p>
                {markers.map((m) => (
                  <div key={m.label} className="flex items-center gap-3">
                    <label className="w-44 shrink-0 text-xs font-semibold text-slate-700">{m.label}</label>
                    <div className="flex flex-1 items-center gap-1">
                      <input
                        type="text"
                        className="flex-1 rounded-lg bg-white px-3 py-2 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        placeholder="Value"
                        value={markerValues[m.label] || ""}
                        onChange={(e) => setMarkerValues((prev) => ({ ...prev, [m.label]: e.target.value }))}
                      />
                      {m.unit && <span className="shrink-0 text-[10px] text-slate-400">{m.unit}</span>}
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
                  className="w-full rounded-lg bg-white p-3 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Enter custom result notes…"
                  value={markerValues["notes"] || ""}
                  onChange={(e) => setMarkerValues({ notes: e.target.value })}
                />
              </div>
            )}

            {/* ── File Upload ── */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                4. Attach Report File (Optional)
              </p>
              <p className="mb-2 text-[11px] text-slate-400">PDF, JPG, PNG or WEBP · Max 5 MB</p>

              {!attachedFile ? (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-6 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50">
                  <Upload size={22} className="text-slate-400" />
                  <span className="text-sm font-semibold text-slate-600">Click to upload a lab report file</span>
                  <span className="text-[11px] text-slate-400">or drag and drop</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  {filePreview === "pdf" ? (
                    <FileText size={28} className="shrink-0 text-red-500" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={filePreview!} alt="preview" className="h-10 w-10 rounded object-cover border border-slate-200" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">{attachedFile.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {(attachedFile.size / 1024).toFixed(0)} KB · {attachedFile.type.split("/")[1].toUpperCase()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Interpretation */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                5. Notes / Interpretation (Optional)
              </p>
              <textarea
                rows={2}
                className="w-full resize-none rounded-lg bg-white p-3 text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Clinical context, flags, observations…"
                value={interpretation}
                onChange={(e) => setInterpretation(e.target.value)}
              />
            </div>

            {/* Messages */}
            {submitError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{submitError}</div>
            )}
            {submitSuccess && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm text-emerald-700">
                ✓ Lab report submitted successfully.
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-[#1A237E] hover:bg-[#111a63] h-11 text-sm font-bold"
            >
              {submitting ? "Submitting…" : "Submit Lab Report"}
            </Button>
          </form>
        </article>

        {/* ── Right: Submitted Reports Queue ── */}
        <article className="space-y-5 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#1A237E]">Submitted Reports</h2>
            <StatusBadge label={`${reports.length} Total`} tone={reports.length > 0 ? "success" : "neutral"} />
          </div>

          {loading && <p className="text-sm text-slate-500">Loading reports…</p>}

          {!loading && reports.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
              <p className="text-2xl">🔬</p>
              <p className="mt-2 text-sm font-semibold text-slate-600">No lab reports submitted yet.</p>
              <p className="mt-1 text-xs text-slate-400">Use the form to submit the first report.</p>
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
                    <th className="px-4 py-4">File</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60">
                  {reports.map((r: any) => {
                    const patient = r.patients;
                    const hasFile = r.result_data?._attachedFile;
                    return (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-mono text-sm font-bold text-slate-800">
                          {r.result_date ? new Date(r.result_date).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                          {patient ? `${patient.first_name} ${patient.last_name}` : r.patient_id?.slice(0, 8)}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-700">{r.result_type}</td>
                        <td className="px-4 py-4">
                          {hasFile ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                              <FileText size={10} /> {r.result_data._attachedFile.type?.includes("pdf") ? "PDF" : "Image"}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">—</span>
                          )}
                        </td>
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
