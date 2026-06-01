"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

type FormState = {
  partner1FirstName: string;
  partner1LastName: string;
  partner1Dob: string;
  partner1Sex: string;
  partner2FirstName: string;
  partner2LastName: string;
  partner2Dob: string;
  partner2Sex: string;
  hasInsurance: string;
  packageType: string;
  paymentPlan: string;
  eSignature: string;
  maritalStatus: string;
  // Compliance / KYC fields (Phase I)
  nartsrId: string;
  idDocumentType: string;
  idDocumentNumber: string;
  medicalVisaStatus: string;
  marriageCertVerified: boolean;
};

const initialState: FormState = {
  partner1FirstName: "",
  partner1LastName: "",
  partner1Dob: "",
  partner1Sex: "",
  partner2FirstName: "",
  partner2LastName: "",
  partner2Dob: "",
  partner2Sex: "",
  hasInsurance: "yes",
  packageType: "Standard IVF",
  paymentPlan: "Monthly Installments",
  eSignature: "",
  maritalStatus: "Married",
  // Compliance / KYC fields (Phase I)
  nartsrId: "",
  idDocumentType: "Aadhar",
  idDocumentNumber: "",
  medicalVisaStatus: "Not Applicable",
  marriageCertVerified: false,
};

// Sidebar macro-phases — 4 stages of the full onboarding journey
const SIDEBAR_PHASES = [
  { id: 1, label: "Account Creation",   sub: "Nurse entry verified",          forStep: 1  },
  { id: 2, label: "Document Intake",    sub: "Phase I Eligibility & IDs",     forStep: 3  },
  { id: 3, label: "Clinical Screening", sub: "Vitals and bloodwork sync",      forStep: 99 },
  { id: 4, label: "Legal Consent",      sub: "E-signatures required",         forStep: 4  },
];

const PROGRESS_MAP: Record<number, number> = { 1: 25, 2: 35, 3: 50, 4: 75 };

export function OnboardingWizard() {
  const [step, setStep]                     = useState(1);
  const [submitted, setSubmitted]           = useState(false);
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [submitError, setSubmitError]       = useState<string | null>(null);
  const [createdPatientId, setCreatedPatientId] = useState<string | null>(null);
  const [formData, setFormData]             = useState<FormState>(initialState);

  // File upload state — UI only (no backend storage yet)
  const [panFile, setPanFile]                   = useState<File | null>(null);
  const [passportFile, setPassportFile]         = useState<File | null>(null);
  const [marriageCertFile, setMarriageCertFile] = useState<File | null>(null);

  const canSubmit = useMemo(() => {
    return (
      formData.partner1FirstName &&
      formData.partner1LastName &&
      formData.partner2FirstName &&
      formData.partner2LastName &&
      formData.eSignature
    );
  }, [formData]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const res = await fetch("/api/nurse/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to create patient");
      }

      setCreatedPatientId(json.data?.id ?? null);
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || "Error creating patient. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Derive age from DOB
  const ageAtIntake = useMemo(() => {
    if (!formData.partner1Dob) return "";
    const dob   = new Date(formData.partner1Dob);
    const today = new Date();
    const age   = today.getFullYear() - dob.getFullYear() -
      (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
    return isNaN(age) ? "" : String(age);
  }, [formData.partner1Dob]);

  const progress = PROGRESS_MAP[step] ?? 25;

  function phaseStatus(phase: (typeof SIDEBAR_PHASES)[0]): "done" | "active" | "pending" {
    if (phase.forStep === 1)  return step > 1 ? "done" : "active";
    if (phase.forStep === 3)  return step > 3 ? "done" : step === 3 ? "active" : "pending";
    if (phase.forStep === 4)  return step === 4 ? "active" : "pending";
    return "pending"; // Clinical Screening — future phase
  }

  /* ── Success screen ── */
  if (submitted) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-sm">
        <h3 className="text-2xl font-extrabold text-[#1A237E]">Onboarding Complete</h3>
        <p className="mt-2 text-sm text-slate-600">
          Couple registration has been saved. Patient ID:{" "}
          <span className="font-bold text-[#1A237E]">{createdPatientId ?? "assigned"}</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          The patient has been assigned to a doctor and will appear on the clinical dashboard.
        </p>
        <Button
          className="mt-5 rounded-lg bg-[#1A237E] hover:bg-[#111a63]"
          onClick={() => {
            setFormData(initialState);
            setStep(1);
            setSubmitted(false);
            setCreatedPatientId(null);
            setPanFile(null);
            setPassportFile(null);
            setMarriageCertFile(null);
          }}
        >
          Start New Onboarding
        </Button>
      </div>
    );
  }

  /* ── Main layout ── */
  return (
    <div className="flex items-start gap-8">

      {/* ════════════════════════════════════
          LEFT — Main content
          ════════════════════════════════════ */}
      <div className="min-w-0 flex-1 space-y-6">

        {/* NARTSR Sync Status Banner */}
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-red-600">NARTSR Sync Status</p>
              <p className="text-sm font-bold text-slate-800">Disconnected</p>
            </div>
          </div>
          <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
            Retry Sync
          </button>
        </div>

        {/* ── Step 1: Personal Details ── */}
        {step === 1 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-xl bg-white p-6 shadow-sm">
              <h4 className="mb-5 text-lg font-bold text-[#1A237E]">Partner 1 (Primary)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">First Name</label>
                  <input className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm focus:border-[#1A237E] focus:outline-none" placeholder="First name" value={formData.partner1FirstName} onChange={(e) => update("partner1FirstName", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Last Name</label>
                  <input className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm focus:border-[#1A237E] focus:outline-none" placeholder="Last name" value={formData.partner1LastName} onChange={(e) => update("partner1LastName", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Date of Birth</label>
                  <input className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm focus:border-[#1A237E] focus:outline-none" type="date" value={formData.partner1Dob} onChange={(e) => update("partner1Dob", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Biological Sex</label>
                  <select className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm focus:border-[#1A237E] focus:outline-none" value={formData.partner1Sex} onChange={(e) => update("partner1Sex", e.target.value)}>
                    <option value="">Select</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            </section>
            <section className="rounded-xl bg-white p-6 shadow-sm">
              <h4 className="mb-5 text-lg font-bold text-[#1A237E]">Partner 2</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">First Name</label>
                  <input className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm focus:border-[#1A237E] focus:outline-none" placeholder="First name" value={formData.partner2FirstName} onChange={(e) => update("partner2FirstName", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Last Name</label>
                  <input className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm focus:border-[#1A237E] focus:outline-none" placeholder="Last name" value={formData.partner2LastName} onChange={(e) => update("partner2LastName", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Date of Birth</label>
                  <input className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm focus:border-[#1A237E] focus:outline-none" type="date" value={formData.partner2Dob} onChange={(e) => update("partner2Dob", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Biological Sex</label>
                  <select className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm focus:border-[#1A237E] focus:outline-none" value={formData.partner2Sex} onChange={(e) => update("partner2Sex", e.target.value)}>
                    <option value="">Select</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ── Step 2: Financial Setup ── */}
        {step === 2 && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h4 className="mb-5 text-lg font-bold text-[#1A237E]">Financial Setup</h4>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Insurance</p>
                <div className="flex gap-2">
                  <button onClick={() => update("hasInsurance", "yes")} className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${formData.hasInsurance === "yes" ? "bg-[#1A237E] text-white" : "border border-slate-200 bg-white text-slate-600"}`}>Yes</button>
                  <button onClick={() => update("hasInsurance", "no")}  className={`rounded-lg px-4 py-2 text-xs font-bold transition-colors ${formData.hasInsurance === "no"  ? "bg-[#1A237E] text-white" : "border border-slate-200 bg-white text-slate-600"}`}>No</button>
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Treatment Package</p>
                <select className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm" value={formData.packageType} onChange={(e) => update("packageType", e.target.value)}>
                  <option>Standard IVF</option>
                  <option>Premium IVF + ICSI</option>
                  <option>Embryo Banking Plan</option>
                </select>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 md:col-span-2">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Payment Plan</p>
                <select className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm" value={formData.paymentPlan} onChange={(e) => update("paymentPlan", e.target.value)}>
                  <option>Monthly Installments</option>
                  <option>Two-Phase Payment</option>
                  <option>Full Advance</option>
                </select>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 md:col-span-2">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">E-Signature</p>
                <input className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm" placeholder="Type full legal name" value={formData.eSignature} onChange={(e) => update("eSignature", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Document Intake (matches reference image) ── */}
        {step === 3 && (
          <div className="space-y-6">

            {/* Patient Eligibility */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100">
                  <svg className="h-4 w-4 text-[#1A237E]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-[#1A237E]">Patient Eligibility</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Legal Name (as per PAN)</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
                    value={[formData.partner1FirstName, formData.partner1LastName].filter(Boolean).join(" ")}
                    readOnly
                    placeholder="Fill in Step 1"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Age at Intake</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
                    value={ageAtIntake}
                    readOnly
                    placeholder="Computed from DOB"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Marital Status</label>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm focus:border-[#1A237E] focus:outline-none"
                    value={formData.maritalStatus}
                    onChange={(e) => update("maritalStatus", e.target.value)}
                  >
                    <option>Married</option>
                    <option>Unmarried</option>
                    <option>Divorced</option>
                    <option>Widowed</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Spouse Name</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
                    value={[formData.partner2FirstName, formData.partner2LastName].filter(Boolean).join(" ")}
                    readOnly
                    placeholder="Fill in Step 1"
                  />
                </div>
              </div>
            </div>

            {/* ID Uploads  +  Marriage Verification — side by side */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

              {/* Mandatory ID Uploads */}
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100">
                    <svg className="h-4 w-4 text-[#1A237E]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-[#1A237E]">Mandatory ID Uploads</h4>
                </div>

                <div className="space-y-3">
                  {/* PAN Card */}
                  <label className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center transition-colors hover:border-[#1A237E] hover:bg-blue-50">
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setPanFile(e.target.files?.[0] ?? null)} />
                    <svg className="mb-2 h-8 w-8 text-slate-400 transition-colors group-hover:text-[#1A237E]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <span className="text-sm font-semibold text-slate-700">PAN Card</span>
                    <span className="mt-0.5 text-xs text-slate-500">PDF or JPEG (Max 10MB)</span>
                    {panFile && <span className="mt-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">{panFile.name}</span>}
                  </label>

                  {/* Passport Copy */}
                  <label className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center transition-colors hover:border-[#1A237E] hover:bg-blue-50">
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setPassportFile(e.target.files?.[0] ?? null)} />
                    <svg className="mb-2 h-8 w-8 text-slate-400 transition-colors group-hover:text-[#1A237E]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5a17.92 17.92 0 0 1-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                    </svg>
                    <span className="text-sm font-semibold text-slate-700">Passport Copy</span>
                    <span className="mt-0.5 text-xs text-slate-500">Scan all visual pages</span>
                    {passportFile && <span className="mt-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">{passportFile.name}</span>}
                  </label>

                  {/* Document Number */}
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Document Number</label>
                    <input
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm focus:border-[#1A237E] focus:outline-none"
                      placeholder="Enter document number"
                      value={formData.idDocumentNumber}
                      onChange={(e) => update("idDocumentNumber", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Marriage Verification */}
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-100">
                    <svg className="h-4 w-4 text-[#1A237E]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-[#1A237E]">Marriage Verification</h4>
                </div>

                {/* File drop zone */}
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center transition-colors hover:border-[#1A237E] hover:bg-blue-50">
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setMarriageCertFile(e.target.files?.[0] ?? null)} />
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
                    <svg className="h-7 w-7 text-[#1A237E]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
                    </svg>
                  </div>
                  <span className="text-base font-bold text-slate-800">Marriage Certificate</span>
                  <span className="mt-1 max-w-xs text-xs text-slate-500">
                    Required for couples initiating ART procedures under current registry laws.
                  </span>
                  {marriageCertFile ? (
                    <span className="mt-3 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">{marriageCertFile.name}</span>
                  ) : (
                    <span className="mt-4 inline-block rounded-lg border-2 border-[#1A237E] px-6 py-2 text-sm font-bold text-[#1A237E]">
                      Browse Files
                    </span>
                  )}
                </label>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">NARTSR Enrollment ID</label>
                    <input
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm focus:border-[#1A237E] focus:outline-none"
                      placeholder="National Registry ID (leave blank if not assigned)"
                      value={formData.nartsrId}
                      onChange={(e) => update("nartsrId", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Medical Visa Status</label>
                    <select
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm focus:border-[#1A237E] focus:outline-none"
                      value={formData.medicalVisaStatus}
                      onChange={(e) => update("medicalVisaStatus", e.target.value)}
                    >
                      <option>Not Applicable</option>
                      <option>Valid</option>
                      <option>Expired</option>
                    </select>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                    <input
                      id="marriageCert"
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 accent-[#1A237E]"
                      checked={formData.marriageCertVerified}
                      onChange={(e) => update("marriageCertVerified", e.target.checked)}
                    />
                    <label htmlFor="marriageCert" className="cursor-pointer text-xs leading-relaxed text-slate-600">
                      I confirm the marriage certificate has been physically verified per ART (Regulation) Act requirements.
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Step 4: Review & Confirm ── */}
        {step === 4 && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h4 className="mb-5 text-lg font-bold text-[#1A237E]">Review & Confirm</h4>
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-bold text-slate-700">Partner 1</p>
                <p>{formData.partner1FirstName} {formData.partner1LastName}</p>
                <p>{formData.partner1Dob || "DOB pending"}</p>
                <p>{formData.partner1Sex || "Sex pending"}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="font-bold text-slate-700">Partner 2</p>
                <p>{formData.partner2FirstName} {formData.partner2LastName}</p>
                <p>{formData.partner2Dob || "DOB pending"}</p>
                <p>{formData.partner2Sex || "Sex pending"}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 md:col-span-2">
                <p className="font-bold text-slate-700">Financial Summary</p>
                <p>Insurance: {formData.hasInsurance === "yes" ? "Available" : "Not Available"}</p>
                <p>Package: {formData.packageType}</p>
                <p>Payment Plan: {formData.paymentPlan}</p>
                <p>E-Signature: {formData.eSignature || "Pending"}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 md:col-span-2">
                <p className="font-bold text-slate-700">Regulatory Summary</p>
                <p>NARTSR ID: {formData.nartsrId || "Not assigned"}</p>
                <p>Document Number: {formData.idDocumentNumber || "Pending"}</p>
                <p>Marital Status: {formData.maritalStatus}</p>
                <p>Medical Visa: {formData.medicalVisaStatus}</p>
                <p>Marriage Certificate: {formData.marriageCertVerified ? "Verified" : "Not verified"}</p>
                <p>PAN Card: {panFile ? panFile.name : "Not uploaded"}</p>
                <p>Passport: {passportFile ? passportFile.name : "Not uploaded"}</p>
                <p>Marriage Cert File: {marriageCertFile ? marriageCertFile.name : "Not uploaded"}</p>
              </div>
            </div>
          </div>
        )}

        {submitError && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {submitError}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-200 pt-6">
          <Button variant="secondary" className="rounded-lg" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1 || isSubmitting}>
            Previous
          </Button>
          {step < 4 ? (
            <Button className="rounded-lg bg-[#1A237E] hover:bg-[#111a63]" onClick={() => setStep((s) => Math.min(4, s + 1))}>
              Next Step
            </Button>
          ) : (
            <Button
              className="rounded-lg bg-[#1A237E] hover:bg-[#111a63]"
              disabled={!canSubmit || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Saving..." : "Confirm & Create Profile"}
            </Button>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════
          RIGHT — Onboarding Progress Sidebar
          ════════════════════════════════════ */}
      <div className="w-64 shrink-0 space-y-4">

        {/* Progress tracker card */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Onboarding Progress</p>
          <p className="mt-1 text-xs font-bold text-[#1A237E]">{progress}% Complete · Phase I</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-1.5 rounded-full bg-[#1A237E] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-5 space-y-1">
            {SIDEBAR_PHASES.map((phase) => {
              const status = phaseStatus(phase);
              return (
                <div
                  key={phase.id}
                  className={`flex items-start gap-3 rounded-lg p-3 ${status === "active" ? "bg-blue-50" : ""}`}
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      status === "done"
                        ? "bg-green-500 text-white"
                        : status === "active"
                        ? "bg-[#1A237E] text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {status === "done" ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    ) : (
                      phase.id
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-bold leading-tight ${status === "pending" ? "text-slate-400" : "text-[#1A237E]"}`}>
                      {phase.label}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{phase.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Registry sync info box */}
        <div className="rounded-xl border-l-4 border-[#1A237E] bg-white p-4 shadow-sm">
          <div className="flex items-start gap-2">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-[#1A237E]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            <div>
              <p className="text-sm font-bold text-[#1A237E]">Syncing with Registry</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Once Phase I is completed, the system will automatically attempt to link these details with the NARTSR database. Ensure PAN numbers are accurate to avoid rejection.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
