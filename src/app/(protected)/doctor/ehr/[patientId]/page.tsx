"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type IVFCycle = {
  id: string;
  status: string;
  start_date: string;
  end_date?: string;
  protocol?: string;
};

type Medication = {
  id: string;
  medication_name: string;
  dose?: string;
  route: string;
  start_date: string;
  end_date?: string;
};

type ClinicalHistory = {
  id: string;
  infertility_type: string;
  duration_years: number;
  previous_treatments?: unknown[];
  family_history?: string;
  female_gynecological_history?: Record<string, unknown>;
  male_medical_history?: Record<string, unknown>;
  created_at: string;
};

type SemenAnalysis = {
  id: string;
  collection_date: string;
  abstinence_days?: number;
  liquefaction_time?: number;
  viscosity?: string;
  volume?: number;
  ph?: number;
  concentration?: number;
  total_count?: number;
  progressive_motility?: number;
  non_progressive_motility?: number;
  immotility?: number;
  morphology_normal?: number;
  round_cells?: number;
  interpretation?: string;
  created_at: string;
};

type ScanRecord = {
  id: string;
  scan_date: string;
  scan_type: string;
  right_follicles?: unknown[];
  left_follicles?: unknown[];
  endometrial_thickness?: number;
  endometrial_pattern?: string;
  hsg_results?: string;
  notes?: string;
  created_at: string;
};

type StimulationLog = {
  id: string;
  log_date: string;
  cycle_day: number;
  fsh_dose?: number;
  hmg_dose?: number;
  estradiol_e2?: number;
  progesterone_p4?: number;
  lh?: number;
  ultrasound_notes?: string;
  created_at: string;
};

type OPURecord = {
  id: string;
  retrieval_date: string;
  total_follicles_aspirated?: number;
  oocytes_retrieved: number;
  mii_count?: number;
  mi_count?: number;
  gv_count?: number;
  empty_follicles_count?: number;
  complications?: string;
  created_at: string;
};

type EmbryologyRecord = {
  id: string;
  fertilization_method: string;
  oocytes_inseminated: number;
  two_pn_count?: number;
  day3_cleavage_count?: number;
  day5_blastocyst_count?: number;
  gardner_grades?: unknown[];
  created_at: string;
};

type EmbryoTransferRecord = {
  id: string;
  transfer_date: string;
  transfer_type: string;
  embryos_transferred: number;
  embryo_grades?: string;
  difficulty?: string;
  catheter_type?: string;
  ultrasound_guidance?: boolean;
  created_at: string;
};

type CycleOutcome = {
  id: string;
  beta_hcg_date_1?: string;
  beta_hcg_value_1?: number;
  beta_hcg_date_2?: string;
  beta_hcg_value_2?: number;
  clinical_pregnancy?: boolean;
  gestational_sacs_count?: number;
  cardiac_activity?: boolean;
  clinical_outcome?: string;
  delivery_date?: string;
  notes?: string;
  created_at: string;
};

type BillingRecord = {
  id: string;
  package_type: string;
  total_amount: number;
  paid_amount: number;
  payment_status: string;
  payment_method?: string;
  invoice_date: string;
  due_date?: string;
  notes?: string;
  created_at: string;
};

type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  blood_type?: string;
  marital_status?: string;
  onboarding_status?: string;
  nartsr_id?: string;
  id_document_type?: string;
  id_document_number?: string;
  medical_visa_status?: string;
  marriage_cert_verified?: boolean;
  medical_history?: {
    partner2?: { first_name?: string; last_name?: string; dob?: string; sex?: string };
    insurance?: string;
    packageType?: string;
    paymentPlan?: string;
    eSignature?: string;
  };
  ivf_cycles?: IVFCycle[];
  medications?: Medication[];
  kyc_documents?: {
    id: string;
    doc_type: string;
    file_url: string;
    status: string;
    created_at: string;
    verified_at?: string;
  }[];
  clinical_history?: ClinicalHistory[];
  semen_analysis?: SemenAnalysis[];
  scan_records?: ScanRecord[];
  stimulation_daily_log?: StimulationLog[];
  opu_records?: OPURecord[];
  embryology_records?: EmbryologyRecord[];
  embryo_transfer_records?: EmbryoTransferRecord[];
  cycle_outcomes?: CycleOutcome[];
  billing_records?: BillingRecord[];
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  "Overview",
  "IVF Cycles",
  "Medications",
  "Inf. History",
  "Semen Analysis",
  "Scans",
  "OPU",
  "Embryology",
  "Outcomes",
  "Billing",
  "Documents",
] as const;
type Tab = (typeof TABS)[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeAge(dob?: string): string {
  if (!dob) return "—";
  const d = new Date(dob);
  const today = new Date();
  const age =
    today.getFullYear() -
    d.getFullYear() -
    (today < new Date(today.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
  return isNaN(age) ? "—" : String(age);
}

function fmt(date?: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN");
}

function fmtNum(v?: number | null, suffix = "") {
  if (v === null || v === undefined) return "—";
  return `${v}${suffix}`;
}

function StatusBadge({ status }: { status?: string }) {
  if (status === "CLEARED")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-green-700">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Cleared
      </span>
    );
  if (status === "PENDING_VERIFICATION")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Pending
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-red-700">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Incomplete
    </span>
  );
}

function SectionHeader({
  title,
  onAdd,
  addLabel = "+ Add Record",
}: {
  title: string;
  onAdd?: () => void;
  addLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h3>
      {onAdd && (
        <button
          onClick={onAdd}
          className="rounded-lg bg-[#1A237E] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#111a63]"
        >
          {addLabel}
        </button>
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="py-12 text-center text-sm text-slate-400">{label}</p>
  );
}

function InfoGrid({ rows }: { rows: [string, string | number | boolean | undefined | null][] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs text-slate-400">{label}</dt>
          <dd className="mt-0.5 font-semibold text-slate-800">
            {value === true ? "Yes" : value === false ? "No" : (value ?? "—")}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ─── Modal Shell ──────────────────────────────────────────────────────────────

function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-[#1A237E]">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto p-6 flex-1">{children}</div>
      </div>
    </div>
  );
}

function ModalSuccess({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
      <p className="font-bold text-green-700">✓ {message}</p>
      <p className="mt-1 text-xs text-green-600">The record has been saved successfully.</p>
    </div>
  );
}

function ModalActions({
  onCancel,
  loading,
  label = "Save Record",
}: {
  onCancel: () => void;
  loading: boolean;
  label?: string;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 rounded-lg border border-slate-200 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors hover:bg-slate-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        className="flex-1 rounded-lg bg-[#1A237E] py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#111a63] disabled:opacity-60"
      >
        {loading ? "Saving…" : label}
      </button>
    </div>
  );
}

// ─── Shared form field helpers ─────────────────────────────────────────────────

const inputCls = "w-full rounded-lg bg-slate-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A237E]";
const labelCls = "mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500";

function Field({
  label,
  required,
  optional,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="text-red-500"> *</span>}
        {optional && <span className="ml-1 text-xs font-normal normal-case text-slate-400">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PatientEHRPage({ isNurseView = false }: { isNurseView?: boolean } = {}) {
  const params = useParams();
  const patientId = params.patientId as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [clearing, setClearing] = useState(false);

  // ── Prescribe modal ──
  const [prescribeOpen, setPrescribeOpen] = useState(false);
  const [prescribeLoading, setPrescribeLoading] = useState(false);
  const [prescribeSuccess, setPrescribeSuccess] = useState(false);
  const [prescribeError, setPrescribeError] = useState<string | null>(null);
  const emptyMed = () => ({
    medicationName: "",
    dose: "",
    route: "Oral",
    frequency: "Daily",
    startDate: "",
    endDate: "",
    instructions: "",
  });
  const [prescribeForms, setPrescribeForms] = useState([emptyMed()]);

  // ── Clinical modals shared state ──
  const [clinicalLoading, setClinicalLoading] = useState(false);
  const [clinicalSuccess, setClinicalSuccess] = useState(false);
  const [clinicalError, setClinicalError] = useState<string | null>(null);

  // ── Infertility History modal ──
  const [histOpen, setHistOpen] = useState(false);
  const [histForm, setHistForm] = useState({
    infertility_type: "PRIMARY",
    duration_years: "",
    family_history: "",
  });

  // ── Semen Analysis modal ──
  const [semenOpen, setSemenOpen] = useState(false);
  const [semenForm, setSemenForm] = useState({
    collection_date: "",
    abstinence_days: "",
    volume: "",
    concentration: "",
    progressive_motility: "",
    morphology_normal: "",
    interpretation: "",
  });

  // ── Scan Records modal ──
  const [scanOpen, setScanOpen] = useState(false);
  const [scanForm, setScanForm] = useState({
    scan_date: "",
    scan_type: "BASELINE",
    endometrial_thickness: "",
    endometrial_pattern: "TRILAMINAR",
    right_follicles: "",
    left_follicles: "",
    notes: "",
  });

  // ── OPU modal ──
  const [opuOpen, setOpuOpen] = useState(false);
  const [opuForm, setOpuForm] = useState({
    retrieval_date: "",
    total_follicles_aspirated: "",
    oocytes_retrieved: "",
    mii_count: "",
    mi_count: "",
    gv_count: "",
    complications: "",
    cycle_id: "",
  });

  // ── Embryology modal ──
  const [embryoOpen, setEmbryoOpen] = useState(false);
  const [embryoForm, setEmbryoForm] = useState({
    fertilization_method: "ICSI",
    oocytes_inseminated: "",
    two_pn_count: "",
    day3_cleavage_count: "",
    day5_blastocyst_count: "",
    cycle_id: "",
  });

  // ── Outcomes modal ──
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [outcomeForm, setOutcomeForm] = useState({
    beta_hcg_date_1: "",
    beta_hcg_value_1: "",
    beta_hcg_date_2: "",
    beta_hcg_value_2: "",
    clinical_pregnancy: "false",
    gestational_sacs_count: "",
    cardiac_activity: "false",
    clinical_outcome: "NEGATIVE",
    notes: "",
    cycle_id: "",
  });

  // ── Billing modal ──
  const [billingOpen, setBillingOpen] = useState(false);
  const [billingForm, setBillingForm] = useState({
    package_type: "",
    total_amount: "",
    paid_amount: "",
    payment_status: "UNPAID",
    payment_method: "CASH",
    invoice_date: "",
    due_date: "",
    notes: "",
  });

  // ── Data fetch ──
  function refreshPatient() {
    return fetch(`/api/doctor/patients/${patientId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setPatient(json.data);
      });
  }

  useEffect(() => {
    if (!patientId) return;
    refreshPatient()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  async function markCleared() {
    if (!patient) return;
    setClearing(true);
    try {
      const res = await fetch(`/api/doctor/patients/${patient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingStatus: "CLEARED" }),
      });
      if (res.ok) setPatient((p) => (p ? { ...p, onboarding_status: "CLEARED" } : p));
    } finally {
      setClearing(false);
    }
  }

  // ── Generic clinical POST helper ──
  async function postClinical(type: string, data: Record<string, unknown>) {
    setClinicalLoading(true);
    setClinicalError(null);
    try {
      const res = await fetch(`/api/doctor/patients/${patientId}/clinical-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save record");
      setClinicalSuccess(true);
      await refreshPatient();
      setTimeout(() => {
        setClinicalSuccess(false);
        closeAllModals();
      }, 1800);
    } catch (err: unknown) {
      setClinicalError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setClinicalLoading(false);
    }
  }

  function closeAllModals() {
    setHistOpen(false);
    setSemenOpen(false);
    setScanOpen(false);
    setOpuOpen(false);
    setEmbryoOpen(false);
    setOutcomeOpen(false);
    setBillingOpen(false);
    setClinicalSuccess(false);
    setClinicalError(null);
  }

  // ── Prescribe handler ──
  async function handlePrescribe(e: React.FormEvent) {
    e.preventDefault();
    if (!patient) return;
    setPrescribeLoading(true);
    setPrescribeError(null);
    try {
      const results = await Promise.all(
        prescribeForms.map((form) =>
          fetch("/api/doctor/medications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patientId: patient.id,
              cycleId: activeCycle?.id || null,
              medicationName: form.medicationName,
              dose: form.dose || null,
              route: form.route,
              frequency: form.frequency,
              startDate: form.startDate,
              endDate: form.endDate || null,
              instructions: form.instructions || null,
            }),
          }).then(async (res) => {
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to prescribe medication");
            return json;
          })
        )
      );
      void results;
      setPrescribeSuccess(true);
      await refreshPatient();
      setTimeout(() => {
        setPrescribeOpen(false);
        setPrescribeSuccess(false);
        setPrescribeForms([emptyMed()]);
      }, 1800);
    } catch (err: unknown) {
      setPrescribeError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setPrescribeLoading(false);
    }
  }

  // ── Infertility history submit ──
  async function handleHistSubmit(e: React.FormEvent) {
    e.preventDefault();
    await postClinical("clinical_history", {
      infertility_type: histForm.infertility_type,
      duration_years: Number(histForm.duration_years),
      family_history: histForm.family_history || null,
    });
  }

  // ── Semen analysis submit ──
  async function handleSemenSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = (v: string) => (v === "" ? undefined : Number(v));
    await postClinical("semen_analysis", {
      collection_date: semenForm.collection_date || undefined,
      abstinence_days: n(semenForm.abstinence_days),
      volume: n(semenForm.volume),
      concentration: n(semenForm.concentration),
      progressive_motility: n(semenForm.progressive_motility),
      morphology_normal: n(semenForm.morphology_normal),
      interpretation: semenForm.interpretation || null,
    });
  }

  // ── Scan records submit ──
  async function handleScanSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parseFollicles = (raw: string) => {
      if (!raw.trim()) return [];
      return raw.split(",").map((s) => Number(s.trim())).filter((n) => !isNaN(n));
    };
    await postClinical("scan_records", {
      scan_date: scanForm.scan_date,
      scan_type: scanForm.scan_type,
      endometrial_thickness: scanForm.endometrial_thickness ? Number(scanForm.endometrial_thickness) : undefined,
      endometrial_pattern: scanForm.endometrial_pattern || undefined,
      right_follicles: parseFollicles(scanForm.right_follicles),
      left_follicles: parseFollicles(scanForm.left_follicles),
      notes: scanForm.notes || null,
    });
  }

  // ── OPU submit ──
  async function handleOpuSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = (v: string) => (v === "" ? undefined : Number(v));
    const cycleId = opuForm.cycle_id || activeCycle?.id;
    if (!cycleId) { setClinicalError("A linked IVF Cycle ID is required for OPU."); return; }
    await postClinical("opu_records", {
      cycle_id: cycleId,
      retrieval_date: opuForm.retrieval_date,
      total_follicles_aspirated: n(opuForm.total_follicles_aspirated),
      oocytes_retrieved: Number(opuForm.oocytes_retrieved),
      mii_count: n(opuForm.mii_count),
      mi_count: n(opuForm.mi_count),
      gv_count: n(opuForm.gv_count),
      complications: opuForm.complications || null,
    });
  }

  // ── Embryology submit ──
  async function handleEmbryoSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = (v: string) => (v === "" ? undefined : Number(v));
    const cycleId = embryoForm.cycle_id || activeCycle?.id;
    if (!cycleId) { setClinicalError("A linked IVF Cycle ID is required for Embryology."); return; }
    await postClinical("embryology_records", {
      cycle_id: cycleId,
      fertilization_method: embryoForm.fertilization_method,
      oocytes_inseminated: Number(embryoForm.oocytes_inseminated),
      two_pn_count: n(embryoForm.two_pn_count),
      day3_cleavage_count: n(embryoForm.day3_cleavage_count),
      day5_blastocyst_count: n(embryoForm.day5_blastocyst_count),
    });
  }

  // ── Outcomes submit ──
  async function handleOutcomeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = (v: string) => (v === "" ? undefined : Number(v));
    const cycleId = outcomeForm.cycle_id || activeCycle?.id;
    if (!cycleId) { setClinicalError("A linked IVF Cycle ID is required for Outcomes."); return; }
    await postClinical("cycle_outcomes", {
      cycle_id: cycleId,
      beta_hcg_date_1: outcomeForm.beta_hcg_date_1 || null,
      beta_hcg_value_1: n(outcomeForm.beta_hcg_value_1),
      beta_hcg_date_2: outcomeForm.beta_hcg_date_2 || null,
      beta_hcg_value_2: n(outcomeForm.beta_hcg_value_2),
      clinical_pregnancy: outcomeForm.clinical_pregnancy === "true",
      gestational_sacs_count: n(outcomeForm.gestational_sacs_count),
      cardiac_activity: outcomeForm.cardiac_activity === "true",
      clinical_outcome: outcomeForm.clinical_outcome,
      notes: outcomeForm.notes || null,
    });
  }

  // ── Billing submit ──
  async function handleBillingSubmit(e: React.FormEvent) {
    e.preventDefault();
    await postClinical("billing_records", {
      package_type: billingForm.package_type,
      total_amount: Number(billingForm.total_amount),
      paid_amount: billingForm.paid_amount ? Number(billingForm.paid_amount) : 0,
      payment_status: billingForm.payment_status,
      payment_method: billingForm.payment_method || null,
      invoice_date: billingForm.invoice_date,
      due_date: billingForm.due_date || null,
      notes: billingForm.notes || null,
    });
  }

  // ─── Render loading / error ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        Loading patient record…
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="rounded-xl bg-red-50 p-6 text-sm text-red-700">
        {error ?? "Patient not found."}
      </div>
    );
  }

  const partner2 = patient.medical_history?.partner2;
  const activeCycle = patient.ivf_cycles?.find(
    (c) => c.status !== "COMPLETED" && c.status !== "CANCELLED"
  );

  // ─── Derived data ────────────────────────────────────────────────────────────

  const cycleOptions = patient.ivf_cycles ?? [];

  // ─── Main render ─────────────────────────────────────────────────────────────

  return (
    <>
      <div className="space-y-6">
        {/* Back */}
        <Link
          href={isNurseView ? "/nurse/dashboard" : "/doctor/dashboard"}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Dashboard
        </Link>

        {/* ── NARTSR Hard Block Warning ── */}
        {!patient.nartsr_id && (
          <div className="rounded-xl bg-red-50 p-4 border border-red-200 flex items-center gap-3">
            <svg className="w-6 h-6 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-sm font-bold text-red-800">Missing NARTSR ID — Cycle Start Blocked</h3>
              <p className="text-xs text-red-700 mt-1">
                Per ART Act 2021 Section 21, this patient must be fully enrolled in the National Registry before a clinical cycle can begin. Please complete all regulatory verification steps.
              </p>
            </div>
          </div>
        )}

        {/* ── Patient Profile Header ── */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            {/* Identity */}
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#000666] to-[#1A237E] text-xl font-black text-white">
                {patient.first_name[0]}
                {patient.last_name[0]}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-extrabold text-slate-900">
                    {patient.first_name} {patient.last_name}
                  </h1>
                  <StatusBadge status={patient.onboarding_status} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="font-bold text-[#1A237E]">{patient.id}</span>
                  {patient.date_of_birth && (
                    <span>DOB: {new Date(patient.date_of_birth).toLocaleDateString("en-IN")}</span>
                  )}
                  <span>Age: {computeAge(patient.date_of_birth)}</span>
                  {patient.gender && <span>{patient.gender}</span>}
                  {patient.blood_type && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                      {patient.blood_type}
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  {patient.email && <span>{patient.email}</span>}
                  {patient.phone && <span>{patient.phone}</span>}
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex gap-3 text-center">
              <div className="rounded-xl bg-slate-50 px-5 py-3">
                <p className="text-2xl font-extrabold text-[#1A237E]">
                  {patient.ivf_cycles?.length ?? 0}
                </p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Cycles
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-5 py-3">
                <p className="text-2xl font-extrabold text-[#1A237E]">
                  {patient.medications?.length ?? 0}
                </p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Medications
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-5 py-3">
                <p className={`text-sm font-extrabold ${activeCycle ? "text-amber-600" : "text-slate-400"}`}>
                  {activeCycle ? activeCycle.status.replace(/_/g, " ") : "No Active"}
                </p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Cycle Status
                </p>
              </div>
            </div>
          </div>

          {/* Partner strip */}
          {partner2?.first_name && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2.5 text-sm">
              <svg className="h-4 w-4 shrink-0 text-[#1A237E]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <span className="text-slate-600">
                <span className="font-bold text-slate-800">Partner: </span>
                {partner2.first_name} {partner2.last_name}
                {partner2.dob && ` · DOB: ${new Date(partner2.dob).toLocaleDateString("en-IN")}`}
                {partner2.sex && ` · ${partner2.sex}`}
              </span>
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex flex-wrap gap-1 rounded-xl bg-white p-1 shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[80px] rounded-lg py-2.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? "bg-[#1A237E] text-white shadow"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── Overview ── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "Overview" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Demographics */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                Demographics
              </h3>
              <dl className="space-y-3 text-sm">
                {[
                  ["Full Name", `${patient.first_name} ${patient.last_name}`],
                  ["Date of Birth", patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString("en-IN") : "—"],
                  ["Age", computeAge(patient.date_of_birth)],
                  ["Gender", patient.gender ?? "—"],
                  ["Blood Type", patient.blood_type ?? "—"],
                  ["Marital Status", patient.marital_status ?? "—"],
                  ["Email", patient.email ?? "—"],
                  ["Phone", patient.phone ?? "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <dt className="shrink-0 text-slate-500">{label}</dt>
                    <dd className="break-all text-right font-semibold text-slate-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Regulatory / KYC */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                Regulatory & KYC
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Onboarding Status</dt>
                  <dd><StatusBadge status={patient.onboarding_status} /></dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">NARTSR ID</dt>
                  <dd className="font-semibold text-slate-800">
                    {patient.nartsr_id ?? <span className="text-slate-400">Not assigned</span>}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">ID Document</dt>
                  <dd className="font-semibold text-slate-800">{patient.id_document_type ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Document Number</dt>
                  <dd className="font-semibold text-slate-800">{patient.id_document_number ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Medical Visa</dt>
                  <dd className="font-semibold text-slate-800">{patient.medical_visa_status ?? "—"}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-slate-500">Marriage Certificate</dt>
                  <dd>
                    {patient.marriage_cert_verified ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">Verified</span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">Not verified</span>
                    )}
                  </dd>
                </div>
              </dl>

              {patient.onboarding_status !== "CLEARED" && !isNurseView && (
                <button
                  onClick={markCleared}
                  disabled={clearing}
                  className="mt-5 w-full rounded-lg bg-[#1A237E] py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#111a63] disabled:opacity-60"
                >
                  {clearing ? "Saving…" : "Mark as Cleared"}
                </button>
              )}
            </div>

            {/* Financial & Treatment */}
            {patient.medical_history && (
              <div className="rounded-xl bg-white p-6 shadow-sm md:col-span-2">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Financial & Treatment
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  {[
                    ["Insurance", patient.medical_history.insurance === "yes" ? "Available" : "Not available"],
                    ["Package", patient.medical_history.packageType ?? "—"],
                    ["Payment Plan", patient.medical_history.paymentPlan ?? "—"],
                    ["E-Signature", patient.medical_history.eSignature ?? "—"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="mt-1 font-semibold text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── IVF Cycles ── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "IVF Cycles" && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <SectionHeader title="IVF Cycles" />
            {!patient.ivf_cycles?.length ? (
              <EmptyState label="No IVF cycles recorded yet." />
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-100">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500">
                      <th className="px-5 py-3">Cycle ID</th>
                      <th className="px-5 py-3">Protocol</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Start Date</th>
                      <th className="px-5 py-3">End Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {patient.ivf_cycles.map((cycle) => (
                      <tr key={cycle.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-mono text-xs text-slate-600">{cycle.id.slice(0, 8)}…</td>
                        <td className="px-5 py-3 text-slate-600">{cycle.protocol ?? "—"}</td>
                        <td className="px-5 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            cycle.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                            cycle.status === "CANCELLED" ? "bg-slate-100 text-slate-500" :
                            "bg-amber-100 text-amber-700"
                          }`}>
                            {cycle.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-600">{fmt(cycle.start_date)}</td>
                        <td className="px-5 py-3 text-slate-600">{cycle.end_date ? fmt(cycle.end_date) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── Medications ── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "Medications" && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <SectionHeader
              title="Medications"
              onAdd={isNurseView ? undefined : () => { setPrescribeOpen(true); setPrescribeError(null); }}
              addLabel="+ Prescribe New"
            />
            {!patient.medications?.length ? (
              <EmptyState label="No medications prescribed yet." />
            ) : (
              <div className="overflow-hidden rounded-lg border border-slate-100">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500">
                      <th className="px-5 py-3">Medication</th>
                      <th className="px-5 py-3">Dose</th>
                      <th className="px-5 py-3">Route</th>
                      <th className="px-5 py-3">Start</th>
                      <th className="px-5 py-3">End</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {patient.medications.map((med) => (
                      <tr key={med.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-semibold text-slate-800">{med.medication_name}</td>
                        <td className="px-5 py-3 text-slate-600">{med.dose ?? "—"}</td>
                        <td className="px-5 py-3 text-slate-600">{med.route}</td>
                        <td className="px-5 py-3 text-slate-600">{fmt(med.start_date)}</td>
                        <td className="px-5 py-3 text-slate-600">{med.end_date ? fmt(med.end_date) : "Ongoing"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── Infertility History ── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "Inf. History" && (
          <div className="space-y-4">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <SectionHeader
                title="Infertility History"
                onAdd={() => { closeAllModals(); setHistOpen(true); }}
                addLabel="+ Add History"
              />
              {!patient.clinical_history?.length ? (
                <EmptyState label="No infertility history recorded yet." />
              ) : (
                <div className="space-y-4">
                  {patient.clinical_history.map((h) => (
                    <div key={h.id} className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                      <div className="mb-3 flex items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                          h.infertility_type === "PRIMARY" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {h.infertility_type}
                        </span>
                        <span className="text-xs text-slate-400">Recorded {fmt(h.created_at)}</span>
                      </div>
                      <InfoGrid rows={[
                        ["Type", h.infertility_type],
                        ["Duration", `${h.duration_years} yr${h.duration_years !== 1 ? "s" : ""}`],
                        ["Family History", h.family_history],
                      ]} />
                      {h.previous_treatments && Array.isArray(h.previous_treatments) && h.previous_treatments.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-slate-400 mb-1">Previous Treatments</p>
                          <p className="text-sm font-semibold text-slate-700">{(h.previous_treatments as string[]).join(", ")}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── Semen Analysis ── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "Semen Analysis" && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <SectionHeader
              title="Semen Analysis (WHO)"
              onAdd={() => { closeAllModals(); setSemenOpen(true); }}
              addLabel="+ Add Analysis"
            />
            {!patient.semen_analysis?.length ? (
              <EmptyState label="No semen analysis records yet." />
            ) : (
              <div className="space-y-4">
                {patient.semen_analysis.map((s) => (
                  <div key={s.id} className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-700">
                        Collection: {fmt(s.collection_date)}
                      </span>
                      {s.interpretation && (
                        <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-semibold text-indigo-700">
                          {s.interpretation}
                        </span>
                      )}
                    </div>
                    <InfoGrid rows={[
                      ["Volume (mL)", fmtNum(s.volume)],
                      ["Concentration (M/mL)", fmtNum(s.concentration)],
                      ["Progressive Motility (%)", fmtNum(s.progressive_motility, "%")],
                      ["Normal Morphology (%)", fmtNum(s.morphology_normal, "%")],
                      ["Abstinence (days)", fmtNum(s.abstinence_days)],
                      ["pH", fmtNum(s.ph)],
                      ["Total Count (M)", fmtNum(s.total_count)],
                      ["Immotility (%)", fmtNum(s.immotility, "%")],
                    ]} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── Scans ── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "Scans" && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <SectionHeader
              title="Scan Records"
              onAdd={() => { closeAllModals(); setScanOpen(true); }}
              addLabel="+ Log Scan"
            />
            {!patient.scan_records?.length ? (
              <EmptyState label="No scan records yet." />
            ) : (
              <div className="space-y-4">
                {patient.scan_records.map((sc) => {
                  const rf = Array.isArray(sc.right_follicles) ? (sc.right_follicles as number[]) : [];
                  const lf = Array.isArray(sc.left_follicles) ? (sc.left_follicles as number[]) : [];
                  return (
                    <div key={sc.id} className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                      <div className="mb-3 flex flex-wrap items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                          sc.scan_type === "BASELINE" ? "bg-blue-100 text-blue-700" :
                          sc.scan_type === "MONITORING" ? "bg-green-100 text-green-700" :
                          sc.scan_type === "HSG" ? "bg-orange-100 text-orange-700" :
                          "bg-slate-200 text-slate-600"
                        }`}>
                          {sc.scan_type}
                        </span>
                        <span className="text-sm font-semibold text-slate-700">{fmt(sc.scan_date)}</span>
                      </div>
                      <InfoGrid rows={[
                        ["Endometrial Thickness", fmtNum(sc.endometrial_thickness, " mm")],
                        ["Endometrial Pattern", sc.endometrial_pattern],
                        ["Right Follicles", rf.length ? `${rf.length} (${rf.map(f => f + "mm").join(", ")})` : "—"],
                        ["Left Follicles", lf.length ? `${lf.length} (${lf.map(f => f + "mm").join(", ")})` : "—"],
                      ]} />
                      {sc.notes && (
                        <p className="mt-3 text-xs text-slate-500 border-t border-slate-200 pt-3">{sc.notes}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── OPU ── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "OPU" && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <SectionHeader
              title="Oocyte Pick-Up (OPU)"
              onAdd={() => { closeAllModals(); setOpuOpen(true); }}
              addLabel="+ Log OPU"
            />
            {!patient.opu_records?.length ? (
              <EmptyState label="No OPU records yet." />
            ) : (
              <div className="space-y-4">
                {patient.opu_records.map((o) => (
                  <div key={o.id} className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                    <div className="mb-3">
                      <span className="text-sm font-bold text-slate-700">
                        Retrieval: {fmt(o.retrieval_date)}
                      </span>
                    </div>
                    <InfoGrid rows={[
                      ["Oocytes Retrieved", fmtNum(o.oocytes_retrieved)],
                      ["Total Follicles Aspirated", fmtNum(o.total_follicles_aspirated)],
                      ["MII (Mature)", fmtNum(o.mii_count)],
                      ["MI (Intermediate)", fmtNum(o.mi_count)],
                      ["GV (Immature)", fmtNum(o.gv_count)],
                      ["Empty Follicles", fmtNum(o.empty_follicles_count)],
                    ]} />
                    {o.complications && (
                      <div className="mt-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                        <p className="text-xs font-bold text-red-600">Complications</p>
                        <p className="text-xs text-red-700 mt-0.5">{o.complications}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── Embryology ── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "Embryology" && (
          <div className="space-y-6">
            {/* Embryology Records */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <SectionHeader
                title="Embryology Records"
                onAdd={() => { closeAllModals(); setEmbryoOpen(true); }}
                addLabel="+ Log Embryology"
              />
              {!patient.embryology_records?.length ? (
                <EmptyState label="No embryology records yet." />
              ) : (
                <div className="space-y-4">
                  {patient.embryology_records.map((em) => (
                    <div key={em.id} className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                      <div className="mb-3 flex items-center gap-3">
                        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                          {em.fertilization_method}
                        </span>
                        <span className="text-xs text-slate-400">Recorded {fmt(em.created_at)}</span>
                      </div>
                      <InfoGrid rows={[
                        ["Method", em.fertilization_method],
                        ["Oocytes Inseminated", fmtNum(em.oocytes_inseminated)],
                        ["2PN (Fertilized)", fmtNum(em.two_pn_count)],
                        ["Day 3 Cleavage", fmtNum(em.day3_cleavage_count)],
                        ["Day 5 Blastocysts", fmtNum(em.day5_blastocyst_count)],
                        ["Gardner Grades", em.gardner_grades && (em.gardner_grades as string[]).length ? (em.gardner_grades as string[]).join(", ") : "—"],
                      ]} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Embryo Transfer Records */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xs font-bold uppercase tracking-wider text-slate-500">Embryo Transfer</h3>
              {!patient.embryo_transfer_records?.length ? (
                <EmptyState label="No embryo transfer records yet." />
              ) : (
                <div className="space-y-4">
                  {patient.embryo_transfer_records.map((et) => (
                    <div key={et.id} className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                      <div className="mb-3 flex flex-wrap items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                          et.transfer_type === "FRESH" ? "bg-emerald-100 text-emerald-700" : "bg-sky-100 text-sky-700"
                        }`}>
                          {et.transfer_type}
                        </span>
                        <span className="text-sm font-semibold text-slate-700">{fmt(et.transfer_date)}</span>
                      </div>
                      <InfoGrid rows={[
                        ["Embryos Transferred", fmtNum(et.embryos_transferred)],
                        ["Embryo Grades", et.embryo_grades],
                        ["Difficulty", et.difficulty],
                        ["Catheter", et.catheter_type],
                        ["US Guidance", et.ultrasound_guidance],
                      ]} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── Outcomes ── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "Outcomes" && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <SectionHeader
              title="Cycle Outcomes"
              onAdd={() => { closeAllModals(); setOutcomeOpen(true); }}
              addLabel="+ Log Outcome"
            />
            {!patient.cycle_outcomes?.length ? (
              <EmptyState label="No cycle outcomes recorded yet." />
            ) : (
              <div className="space-y-4">
                {patient.cycle_outcomes.map((co) => (
                  <div key={co.id} className="rounded-xl border border-slate-100 bg-slate-50 p-5">
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      {co.clinical_outcome && (
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                          co.clinical_outcome === "LIVE_BIRTH" || co.clinical_outcome === "ONGOING" ? "bg-green-100 text-green-700" :
                          co.clinical_outcome === "NEGATIVE" || co.clinical_outcome === "CHEMICAL" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {co.clinical_outcome.replace(/_/g, " ")}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">Recorded {fmt(co.created_at)}</span>
                    </div>
                    <InfoGrid rows={[
                      ["β-hCG (Test 1)", co.beta_hcg_date_1 ? `${fmtNum(co.beta_hcg_value_1)} mIU/mL on ${fmt(co.beta_hcg_date_1)}` : "—"],
                      ["β-hCG (Test 2)", co.beta_hcg_date_2 ? `${fmtNum(co.beta_hcg_value_2)} mIU/mL on ${fmt(co.beta_hcg_date_2)}` : "—"],
                      ["Clinical Pregnancy", co.clinical_pregnancy],
                      ["Gestational Sacs", fmtNum(co.gestational_sacs_count)],
                      ["Cardiac Activity", co.cardiac_activity],
                      ["Delivery Date", co.delivery_date ? fmt(co.delivery_date) : "—"],
                    ]} />
                    {co.notes && (
                      <p className="mt-3 text-xs text-slate-500 border-t border-slate-200 pt-3">{co.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── Billing ── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "Billing" && (
          <div className="space-y-6">
            {/* Summary strip */}
            {(patient.billing_records?.length ?? 0) > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {[
                  ["Total Billed", `₹${(patient.billing_records ?? []).reduce((s, b) => s + b.total_amount, 0).toLocaleString("en-IN")}`],
                  ["Total Paid", `₹${(patient.billing_records ?? []).reduce((s, b) => s + b.paid_amount, 0).toLocaleString("en-IN")}`],
                  ["Pending", `₹${(patient.billing_records ?? []).reduce((s, b) => s + (b.total_amount - b.paid_amount), 0).toLocaleString("en-IN")}`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-white p-5 shadow-sm text-center">
                    <p className="text-xl font-extrabold text-[#1A237E]">{value}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <SectionHeader
                title="Billing Records"
                onAdd={() => { closeAllModals(); setBillingOpen(true); }}
                addLabel="+ Add Invoice"
              />
              {!patient.billing_records?.length ? (
                <EmptyState label="No billing records yet." />
              ) : (
                <div className="overflow-hidden rounded-lg border border-slate-100">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500">
                        <th className="px-4 py-3">Package</th>
                        <th className="px-4 py-3">Invoice Date</th>
                        <th className="px-4 py-3">Total</th>
                        <th className="px-4 py-3">Paid</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {patient.billing_records.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-800">{b.package_type}</td>
                          <td className="px-4 py-3 text-slate-600">{fmt(b.invoice_date)}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">₹{b.total_amount.toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3 text-slate-600">₹{b.paid_amount.toLocaleString("en-IN")}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              b.payment_status === "FULLY_PAID" ? "bg-green-100 text-green-700" :
                              b.payment_status === "PARTIALLY_PAID" ? "bg-amber-100 text-amber-700" :
                              b.payment_status === "REFUNDED" ? "bg-blue-100 text-blue-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {b.payment_status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{b.payment_method ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ── Documents ── */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "Documents" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Consent status */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                Consent Status
              </h3>
              <div className="space-y-2">
                {[
                  { label: "Treatment Consent", done: patient.onboarding_status !== "INCOMPLETE" },
                  { label: "Cryopreservation Consent", done: false },
                  { label: "ART Procedure Consent", done: patient.marriage_cert_verified ?? false },
                  { label: "Data Privacy Consent", done: patient.onboarding_status !== "INCOMPLETE" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    {item.done ? (
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">Signed</span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">Pending</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Identity documents */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                Identity Documents
              </h3>
              <div className="space-y-2">
                {[
                  { label: patient.id_document_type ?? "ID Document", value: patient.id_document_number ?? "Not uploaded" },
                  { label: "NARTSR Enrollment", value: patient.nartsr_id ?? "Not assigned" },
                  { label: "Medical Visa", value: patient.medical_visa_status ?? "N/A" },
                  { label: "Marriage Certificate", value: patient.marriage_cert_verified ? "Verified" : "Not verified" },
                ].map((doc) => (
                  <div key={doc.label} className="flex items-start justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
                    <span className="font-medium text-slate-700">{doc.label}</span>
                    <span className="max-w-[180px] break-all text-right text-xs text-slate-500">{doc.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Uploaded Files */}
            <div className="rounded-xl bg-white p-6 shadow-sm md:col-span-2">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                Uploaded Files
              </h3>
              {(!patient.kyc_documents || patient.kyc_documents.length === 0) ? (
                <p className="py-8 text-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg">
                  No documents uploaded yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {patient.kyc_documents.map((doc) => (
                    <div key={doc.id} className="flex flex-col justify-between rounded-lg border border-slate-100 bg-slate-50 p-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-slate-700 text-sm">{doc.doc_type?.replace(/_/g, " ")}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${doc.status === "VERIFIED" ? "bg-green-100 text-green-700" : doc.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                            {doc.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Uploaded on {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "—"}</p>
                      </div>
                      {doc.file_url && !doc.file_url.startsWith("placeholder://") ? (
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:border-slate-300"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                          View File
                        </a>
                      ) : (
                        <span className="mt-4 inline-flex w-full items-center justify-center py-2 text-xs text-slate-400">File pending storage setup</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ── MODALS ── */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}

      {/* Prescribe Medication */}
      {prescribeOpen && (
        <Modal
          title="Prescribe Medication"
          subtitle={`${patient.first_name} ${patient.last_name}${activeCycle ? ` · Active: ${activeCycle.status.replace(/_/g, " ")}` : ""}`}
          onClose={() => { setPrescribeOpen(false); setPrescribeForms([emptyMed()]); setPrescribeError(null); setPrescribeSuccess(false); }}
        >
          {prescribeSuccess ? (
            <ModalSuccess message={`${prescribeForms.length} medication${prescribeForms.length > 1 ? "s" : ""} prescribed successfully`} />
          ) : (
            <form onSubmit={handlePrescribe} className="space-y-4">
              {prescribeError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{prescribeError}</div>
              )}

              {prescribeForms.map((form, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
                >
                  {/* Medication header row */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1A237E]">
                      Medication {prescribeForms.length > 1 ? `#${idx + 1}` : ""}
                    </span>
                    {prescribeForms.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPrescribeForms((prev) => prev.filter((_, i) => i !== idx))}
                        className="rounded-full px-2.5 py-0.5 text-xs font-bold text-red-500 hover:bg-red-100 transition-colors"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>

                  <Field label="Medication Name" required>
                    <input
                      required
                      value={form.medicationName}
                      onChange={(e) => setPrescribeForms((prev) => prev.map((f, i) => i === idx ? { ...f, medicationName: e.target.value } : f))}
                      placeholder="e.g. Gonal-F, Menopur, Progesterone"
                      className={inputCls}
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Dose" optional>
                      <input
                        value={form.dose}
                        onChange={(e) => setPrescribeForms((prev) => prev.map((f, i) => i === idx ? { ...f, dose: e.target.value } : f))}
                        placeholder="e.g. 75 IU"
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Route" required>
                      <select
                        required
                        value={form.route}
                        onChange={(e) => setPrescribeForms((prev) => prev.map((f, i) => i === idx ? { ...f, route: e.target.value } : f))}
                        className={inputCls}
                      >
                        <option>Oral</option><option>Subcutaneous</option><option>Intramuscular</option>
                        <option>Vaginal</option><option>Transdermal</option><option>Intravenous</option>
                      </select>
                    </Field>
                  </div>

                  <Field label="Frequency" required>
                    <select
                      required
                      value={form.frequency}
                      onChange={(e) => setPrescribeForms((prev) => prev.map((f, i) => i === idx ? { ...f, frequency: e.target.value } : f))}
                      className={inputCls}
                    >
                      <option>Daily</option><option>Twice daily</option><option>Three times daily</option>
                      <option>Every other day</option><option>Weekly</option><option>As needed</option>
                    </select>
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Start Date" required>
                      <input
                        required
                        type="date"
                        value={form.startDate}
                        onChange={(e) => setPrescribeForms((prev) => prev.map((f, i) => i === idx ? { ...f, startDate: e.target.value } : f))}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="End Date" optional>
                      <input
                        type="date"
                        value={form.endDate}
                        onChange={(e) => setPrescribeForms((prev) => prev.map((f, i) => i === idx ? { ...f, endDate: e.target.value } : f))}
                        className={inputCls}
                      />
                    </Field>
                  </div>

                  <Field label="Instructions" optional>
                    <textarea
                      rows={2}
                      value={form.instructions}
                      onChange={(e) => setPrescribeForms((prev) => prev.map((f, i) => i === idx ? { ...f, instructions: e.target.value } : f))}
                      placeholder="e.g. Take with food, inject in abdomen..."
                      className={`${inputCls} resize-none`}
                    />
                  </Field>
                </div>
              ))}

              {/* Add Medicine button */}
              <button
                type="button"
                onClick={() => setPrescribeForms((prev) => [...prev, emptyMed()])}
                className="w-full rounded-lg border-2 border-dashed border-[#1A237E]/30 py-2.5 text-xs font-bold uppercase tracking-wider text-[#1A237E] transition-colors hover:border-[#1A237E] hover:bg-blue-50"
              >
                + Add Medicine
              </button>

              <ModalActions
                onCancel={() => { setPrescribeOpen(false); setPrescribeForms([emptyMed()]); setPrescribeError(null); }}
                loading={prescribeLoading}
                label={prescribeForms.length > 1 ? `Prescribe All (${prescribeForms.length})` : "Prescribe"}
              />
            </form>
          )}
        </Modal>
      )}

      {/* Infertility History */}
      {histOpen && (
        <Modal title="Add Infertility History" subtitle={`${patient.first_name} ${patient.last_name}`} onClose={closeAllModals}>
          {clinicalSuccess ? <ModalSuccess message="Infertility history saved" /> : (
            <form onSubmit={handleHistSubmit} className="space-y-4">
              {clinicalError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{clinicalError}</div>}
              <Field label="Infertility Type" required>
                <select required value={histForm.infertility_type} onChange={(e) => setHistForm((f) => ({ ...f, infertility_type: e.target.value }))} className={inputCls}>
                  <option value="PRIMARY">Primary</option>
                  <option value="SECONDARY">Secondary</option>
                </select>
              </Field>
              <Field label="Duration (years)" required>
                <input required type="number" min="0" value={histForm.duration_years} onChange={(e) => setHistForm((f) => ({ ...f, duration_years: e.target.value }))} placeholder="e.g. 3" className={inputCls} />
              </Field>
              <Field label="Family History" optional>
                <textarea rows={3} value={histForm.family_history} onChange={(e) => setHistForm((f) => ({ ...f, family_history: e.target.value }))} placeholder="Relevant family history, hereditary conditions..." className={`${inputCls} resize-none`} />
              </Field>
              <ModalActions onCancel={closeAllModals} loading={clinicalLoading} />
            </form>
          )}
        </Modal>
      )}

      {/* Semen Analysis */}
      {semenOpen && (
        <Modal title="Add Semen Analysis" subtitle={`${patient.first_name} ${patient.last_name} — WHO Parameters`} onClose={closeAllModals}>
          {clinicalSuccess ? <ModalSuccess message="Semen analysis saved" /> : (
            <form onSubmit={handleSemenSubmit} className="space-y-4">
              {clinicalError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{clinicalError}</div>}
              <Field label="Collection Date" optional>
                <input type="datetime-local" value={semenForm.collection_date} onChange={(e) => setSemenForm((f) => ({ ...f, collection_date: e.target.value }))} className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Abstinence Days" optional>
                  <input type="number" min="0" value={semenForm.abstinence_days} onChange={(e) => setSemenForm((f) => ({ ...f, abstinence_days: e.target.value }))} placeholder="2-7" className={inputCls} />
                </Field>
                <Field label="Volume (mL)" optional>
                  <input type="number" min="0" step="0.1" value={semenForm.volume} onChange={(e) => setSemenForm((f) => ({ ...f, volume: e.target.value }))} placeholder="≥1.5" className={inputCls} />
                </Field>
                <Field label="Concentration (M/mL)" optional>
                  <input type="number" min="0" step="0.01" value={semenForm.concentration} onChange={(e) => setSemenForm((f) => ({ ...f, concentration: e.target.value }))} placeholder="≥16" className={inputCls} />
                </Field>
                <Field label="Progressive Motility (%)" optional>
                  <input type="number" min="0" max="100" step="0.1" value={semenForm.progressive_motility} onChange={(e) => setSemenForm((f) => ({ ...f, progressive_motility: e.target.value }))} placeholder="≥30" className={inputCls} />
                </Field>
                <Field label="Normal Morphology (%)" optional>
                  <input type="number" min="0" max="100" step="0.1" value={semenForm.morphology_normal} onChange={(e) => setSemenForm((f) => ({ ...f, morphology_normal: e.target.value }))} placeholder="≥4" className={inputCls} />
                </Field>
              </div>
              <Field label="Interpretation" optional>
                <input value={semenForm.interpretation} onChange={(e) => setSemenForm((f) => ({ ...f, interpretation: e.target.value }))} placeholder="e.g. Normozoospermia, Oligospermia..." className={inputCls} />
              </Field>
              <ModalActions onCancel={closeAllModals} loading={clinicalLoading} />
            </form>
          )}
        </Modal>
      )}

      {/* Scan Records */}
      {scanOpen && (
        <Modal title="Log Scan Record" subtitle={`${patient.first_name} ${patient.last_name}`} onClose={closeAllModals}>
          {clinicalSuccess ? <ModalSuccess message="Scan record saved" /> : (
            <form onSubmit={handleScanSubmit} className="space-y-4">
              {clinicalError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{clinicalError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Scan Date" required>
                  <input required type="datetime-local" value={scanForm.scan_date} onChange={(e) => setScanForm((f) => ({ ...f, scan_date: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="Scan Type" required>
                  <select required value={scanForm.scan_type} onChange={(e) => setScanForm((f) => ({ ...f, scan_type: e.target.value }))} className={inputCls}>
                    <option value="BASELINE">Baseline</option>
                    <option value="MONITORING">Monitoring</option>
                    <option value="HSG">HSG</option>
                    <option value="OTHER">Other</option>
                  </select>
                </Field>
                <Field label="Endometrial Thickness (mm)" optional>
                  <input type="number" min="0" step="0.1" value={scanForm.endometrial_thickness} onChange={(e) => setScanForm((f) => ({ ...f, endometrial_thickness: e.target.value }))} placeholder="e.g. 9.2" className={inputCls} />
                </Field>
                <Field label="Endometrial Pattern" optional>
                  <select value={scanForm.endometrial_pattern} onChange={(e) => setScanForm((f) => ({ ...f, endometrial_pattern: e.target.value }))} className={inputCls}>
                    <option value="">Select…</option>
                    <option value="TRILAMINAR">Trilaminar</option>
                    <option value="HOMOGENEOUS">Homogeneous</option>
                    <option value="HYPERECHOIC">Hyperechoic</option>
                    <option value="OTHER">Other</option>
                  </select>
                </Field>
              </div>
              <Field label="Right Follicles (mm, comma-separated)" optional>
                <input value={scanForm.right_follicles} onChange={(e) => setScanForm((f) => ({ ...f, right_follicles: e.target.value }))} placeholder="e.g. 12, 14, 16, 18" className={inputCls} />
              </Field>
              <Field label="Left Follicles (mm, comma-separated)" optional>
                <input value={scanForm.left_follicles} onChange={(e) => setScanForm((f) => ({ ...f, left_follicles: e.target.value }))} placeholder="e.g. 11, 13, 15" className={inputCls} />
              </Field>
              <Field label="Notes" optional>
                <textarea rows={2} value={scanForm.notes} onChange={(e) => setScanForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Additional observations..." className={`${inputCls} resize-none`} />
              </Field>
              <ModalActions onCancel={closeAllModals} loading={clinicalLoading} />
            </form>
          )}
        </Modal>
      )}

      {/* OPU */}
      {opuOpen && (
        <Modal title="Log OPU Record" subtitle={`${patient.first_name} ${patient.last_name}`} onClose={closeAllModals}>
          {clinicalSuccess ? <ModalSuccess message="OPU record saved" /> : (
            <form onSubmit={handleOpuSubmit} className="space-y-4">
              {clinicalError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{clinicalError}</div>}
              {cycleOptions.length > 0 && (
                <Field label="Linked IVF Cycle" required>
                  <select value={opuForm.cycle_id || activeCycle?.id || ""} onChange={(e) => setOpuForm((f) => ({ ...f, cycle_id: e.target.value }))} className={inputCls}>
                    {cycleOptions.map((c) => (
                      <option key={c.id} value={c.id}>{c.id.slice(0, 8)}… — {c.status} ({fmt(c.start_date)})</option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="Retrieval Date" required>
                <input required type="datetime-local" value={opuForm.retrieval_date} onChange={(e) => setOpuForm((f) => ({ ...f, retrieval_date: e.target.value }))} className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Oocytes Retrieved" required>
                  <input required type="number" min="0" value={opuForm.oocytes_retrieved} onChange={(e) => setOpuForm((f) => ({ ...f, oocytes_retrieved: e.target.value }))} placeholder="e.g. 10" className={inputCls} />
                </Field>
                <Field label="Total Follicles Aspirated" optional>
                  <input type="number" min="0" value={opuForm.total_follicles_aspirated} onChange={(e) => setOpuForm((f) => ({ ...f, total_follicles_aspirated: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="MII (Mature)" optional>
                  <input type="number" min="0" value={opuForm.mii_count} onChange={(e) => setOpuForm((f) => ({ ...f, mii_count: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="MI (Intermediate)" optional>
                  <input type="number" min="0" value={opuForm.mi_count} onChange={(e) => setOpuForm((f) => ({ ...f, mi_count: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="GV (Immature)" optional>
                  <input type="number" min="0" value={opuForm.gv_count} onChange={(e) => setOpuForm((f) => ({ ...f, gv_count: e.target.value }))} className={inputCls} />
                </Field>
              </div>
              <Field label="Complications" optional>
                <textarea rows={2} value={opuForm.complications} onChange={(e) => setOpuForm((f) => ({ ...f, complications: e.target.value }))} placeholder="e.g. OHSS, bleeding..." className={`${inputCls} resize-none`} />
              </Field>
              <ModalActions onCancel={closeAllModals} loading={clinicalLoading} />
            </form>
          )}
        </Modal>
      )}

      {/* Embryology */}
      {embryoOpen && (
        <Modal title="Log Embryology Record" subtitle={`${patient.first_name} ${patient.last_name}`} onClose={closeAllModals}>
          {clinicalSuccess ? <ModalSuccess message="Embryology record saved" /> : (
            <form onSubmit={handleEmbryoSubmit} className="space-y-4">
              {clinicalError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{clinicalError}</div>}
              {cycleOptions.length > 0 && (
                <Field label="Linked IVF Cycle" required>
                  <select value={embryoForm.cycle_id || activeCycle?.id || ""} onChange={(e) => setEmbryoForm((f) => ({ ...f, cycle_id: e.target.value }))} className={inputCls}>
                    {cycleOptions.map((c) => (
                      <option key={c.id} value={c.id}>{c.id.slice(0, 8)}… — {c.status} ({fmt(c.start_date)})</option>
                    ))}
                  </select>
                </Field>
              )}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fertilization Method" required>
                  <select required value={embryoForm.fertilization_method} onChange={(e) => setEmbryoForm((f) => ({ ...f, fertilization_method: e.target.value }))} className={inputCls}>
                    <option value="IVF">IVF</option>
                    <option value="ICSI">ICSI</option>
                    <option value="SPLIT">Split (IVF+ICSI)</option>
                  </select>
                </Field>
                <Field label="Oocytes Inseminated" required>
                  <input required type="number" min="0" value={embryoForm.oocytes_inseminated} onChange={(e) => setEmbryoForm((f) => ({ ...f, oocytes_inseminated: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="2PN Count (Fertilized)" optional>
                  <input type="number" min="0" value={embryoForm.two_pn_count} onChange={(e) => setEmbryoForm((f) => ({ ...f, two_pn_count: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="Day 3 Cleavage Count" optional>
                  <input type="number" min="0" value={embryoForm.day3_cleavage_count} onChange={(e) => setEmbryoForm((f) => ({ ...f, day3_cleavage_count: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="Day 5 Blastocyst Count" optional>
                  <input type="number" min="0" value={embryoForm.day5_blastocyst_count} onChange={(e) => setEmbryoForm((f) => ({ ...f, day5_blastocyst_count: e.target.value }))} className={inputCls} />
                </Field>
              </div>
              <ModalActions onCancel={closeAllModals} loading={clinicalLoading} />
            </form>
          )}
        </Modal>
      )}

      {/* Outcomes */}
      {outcomeOpen && (
        <Modal title="Log Cycle Outcome" subtitle={`${patient.first_name} ${patient.last_name}`} onClose={closeAllModals}>
          {clinicalSuccess ? <ModalSuccess message="Cycle outcome saved" /> : (
            <form onSubmit={handleOutcomeSubmit} className="space-y-4">
              {clinicalError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{clinicalError}</div>}
              {cycleOptions.length > 0 && (
                <Field label="Linked IVF Cycle" required>
                  <select value={outcomeForm.cycle_id || activeCycle?.id || ""} onChange={(e) => setOutcomeForm((f) => ({ ...f, cycle_id: e.target.value }))} className={inputCls}>
                    {cycleOptions.map((c) => (
                      <option key={c.id} value={c.id}>{c.id.slice(0, 8)}… — {c.status} ({fmt(c.start_date)})</option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label="Clinical Outcome" required>
                <select required value={outcomeForm.clinical_outcome} onChange={(e) => setOutcomeForm((f) => ({ ...f, clinical_outcome: e.target.value }))} className={inputCls}>
                  <option value="NEGATIVE">Negative</option>
                  <option value="CHEMICAL">Chemical Pregnancy</option>
                  <option value="ONGOING">Ongoing Pregnancy</option>
                  <option value="MISCARRIAGE">Miscarriage</option>
                  <option value="ECTOPIC">Ectopic</option>
                  <option value="LIVE_BIRTH">Live Birth</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="β-hCG Date (1st)" optional>
                  <input type="date" value={outcomeForm.beta_hcg_date_1} onChange={(e) => setOutcomeForm((f) => ({ ...f, beta_hcg_date_1: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="β-hCG Value (mIU/mL)" optional>
                  <input type="number" min="0" step="0.01" value={outcomeForm.beta_hcg_value_1} onChange={(e) => setOutcomeForm((f) => ({ ...f, beta_hcg_value_1: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="β-hCG Date (2nd)" optional>
                  <input type="date" value={outcomeForm.beta_hcg_date_2} onChange={(e) => setOutcomeForm((f) => ({ ...f, beta_hcg_date_2: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="β-hCG Value (2nd)" optional>
                  <input type="number" min="0" step="0.01" value={outcomeForm.beta_hcg_value_2} onChange={(e) => setOutcomeForm((f) => ({ ...f, beta_hcg_value_2: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="Clinical Pregnancy" optional>
                  <select value={outcomeForm.clinical_pregnancy} onChange={(e) => setOutcomeForm((f) => ({ ...f, clinical_pregnancy: e.target.value }))} className={inputCls}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </Field>
                <Field label="Gestational Sacs" optional>
                  <input type="number" min="0" value={outcomeForm.gestational_sacs_count} onChange={(e) => setOutcomeForm((f) => ({ ...f, gestational_sacs_count: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="Cardiac Activity" optional>
                  <select value={outcomeForm.cardiac_activity} onChange={(e) => setOutcomeForm((f) => ({ ...f, cardiac_activity: e.target.value }))} className={inputCls}>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </Field>
              </div>
              <Field label="Notes" optional>
                <textarea rows={2} value={outcomeForm.notes} onChange={(e) => setOutcomeForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Additional clinical notes..." className={`${inputCls} resize-none`} />
              </Field>
              <ModalActions onCancel={closeAllModals} loading={clinicalLoading} />
            </form>
          )}
        </Modal>
      )}

      {/* Billing */}
      {billingOpen && (
        <Modal title="Add Billing Record" subtitle={`${patient.first_name} ${patient.last_name}`} onClose={closeAllModals}>
          {clinicalSuccess ? <ModalSuccess message="Billing record saved" /> : (
            <form onSubmit={handleBillingSubmit} className="space-y-4">
              {clinicalError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{clinicalError}</div>}
              <Field label="Package Type" required>
                <input required value={billingForm.package_type} onChange={(e) => setBillingForm((f) => ({ ...f, package_type: e.target.value }))} placeholder="e.g. IVF Basic, IVF + ICSI, Frozen Embryo Transfer" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Total Amount (₹)" required>
                  <input required type="number" min="0" step="0.01" value={billingForm.total_amount} onChange={(e) => setBillingForm((f) => ({ ...f, total_amount: e.target.value }))} placeholder="e.g. 150000" className={inputCls} />
                </Field>
                <Field label="Paid Amount (₹)" optional>
                  <input type="number" min="0" step="0.01" value={billingForm.paid_amount} onChange={(e) => setBillingForm((f) => ({ ...f, paid_amount: e.target.value }))} placeholder="0" className={inputCls} />
                </Field>
                <Field label="Payment Status" required>
                  <select required value={billingForm.payment_status} onChange={(e) => setBillingForm((f) => ({ ...f, payment_status: e.target.value }))} className={inputCls}>
                    <option value="UNPAID">Unpaid</option>
                    <option value="PARTIALLY_PAID">Partially Paid</option>
                    <option value="FULLY_PAID">Fully Paid</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </Field>
                <Field label="Payment Method" optional>
                  <select value={billingForm.payment_method} onChange={(e) => setBillingForm((f) => ({ ...f, payment_method: e.target.value }))} className={inputCls}>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="INSURANCE">Insurance</option>
                    <option value="OTHER">Other</option>
                  </select>
                </Field>
                <Field label="Invoice Date" required>
                  <input required type="date" value={billingForm.invoice_date} onChange={(e) => setBillingForm((f) => ({ ...f, invoice_date: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="Due Date" optional>
                  <input type="date" value={billingForm.due_date} onChange={(e) => setBillingForm((f) => ({ ...f, due_date: e.target.value }))} className={inputCls} />
                </Field>
              </div>
              <Field label="Notes" optional>
                <textarea rows={2} value={billingForm.notes} onChange={(e) => setBillingForm((f) => ({ ...f, notes: e.target.value }))} placeholder="e.g. Insurance claim pending, 50% advance paid..." className={`${inputCls} resize-none`} />
              </Field>
              <ModalActions onCancel={closeAllModals} loading={clinicalLoading} />
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
