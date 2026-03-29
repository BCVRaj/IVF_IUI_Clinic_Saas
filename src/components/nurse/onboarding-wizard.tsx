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
};

const steps = ["Personal Details", "Financial Setup", "Review & Confirm"];

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormState>(initialState);

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

  if (submitted) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-sm">
        <h3 className="text-2xl font-extrabold text-[#1A237E]">Onboarding Complete</h3>
        <p className="mt-2 text-sm text-slate-600">
          Couple registration has been captured and financial setup is confirmed.
        </p>
        <Button
          className="mt-5 rounded-lg bg-[#1A237E] hover:bg-[#111a63]"
          onClick={() => {
            setFormData(initialState);
            setStep(1);
            setSubmitted(false);
          }}
        >
          Start New Onboarding
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative flex items-center justify-between">
        <div className="absolute left-0 top-5 h-[2px] w-full bg-slate-200" />
        {steps.map((label, index) => {
          const current = index + 1;
          const active = step === current;
          const done = step > current;
          return (
            <div key={label} className="relative z-10 bg-[#f7fafc] px-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-10 items-center justify-center rounded-full text-sm font-bold ${
                    active || done
                      ? "bg-gradient-to-r from-[#000666] to-[#1A237E] text-white shadow"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {current}
                </div>
                <span
                  className={`text-sm font-bold ${
                    active || done ? "text-[#1A237E]" : "text-slate-500"
                  }`}
                >
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-xl bg-slate-100 p-6">
            <h4 className="mb-5 text-lg font-bold text-[#1A237E]">Partner 1 (Primary)</h4>
            <div className="grid grid-cols-2 gap-4">
              <input className="rounded-lg bg-white p-3 text-sm" placeholder="First name" value={formData.partner1FirstName} onChange={(e) => update("partner1FirstName", e.target.value)} />
              <input className="rounded-lg bg-white p-3 text-sm" placeholder="Last name" value={formData.partner1LastName} onChange={(e) => update("partner1LastName", e.target.value)} />
              <input className="rounded-lg bg-white p-3 text-sm" type="date" value={formData.partner1Dob} onChange={(e) => update("partner1Dob", e.target.value)} />
              <select className="rounded-lg bg-white p-3 text-sm" value={formData.partner1Sex} onChange={(e) => update("partner1Sex", e.target.value)}>
                <option value="">Biological Sex</option>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </div>
          </section>
          <section className="rounded-xl bg-slate-100 p-6">
            <h4 className="mb-5 text-lg font-bold text-[#1A237E]">Partner 2</h4>
            <div className="grid grid-cols-2 gap-4">
              <input className="rounded-lg bg-white p-3 text-sm" placeholder="First name" value={formData.partner2FirstName} onChange={(e) => update("partner2FirstName", e.target.value)} />
              <input className="rounded-lg bg-white p-3 text-sm" placeholder="Last name" value={formData.partner2LastName} onChange={(e) => update("partner2LastName", e.target.value)} />
              <input className="rounded-lg bg-white p-3 text-sm" type="date" value={formData.partner2Dob} onChange={(e) => update("partner2Dob", e.target.value)} />
              <select className="rounded-lg bg-white p-3 text-sm" value={formData.partner2Sex} onChange={(e) => update("partner2Sex", e.target.value)}>
                <option value="">Biological Sex</option>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </div>
          </section>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h4 className="mb-5 text-lg font-bold text-[#1A237E]">Financial Setup</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-slate-100 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Insurance</p>
              <div className="flex gap-2">
                <button onClick={() => update("hasInsurance", "yes")} className={`rounded-lg px-4 py-2 text-xs font-bold ${formData.hasInsurance === "yes" ? "bg-[#1A237E] text-white" : "bg-white text-slate-600"}`}>Yes</button>
                <button onClick={() => update("hasInsurance", "no")} className={`rounded-lg px-4 py-2 text-xs font-bold ${formData.hasInsurance === "no" ? "bg-[#1A237E] text-white" : "bg-white text-slate-600"}`}>No</button>
              </div>
            </div>
            <div className="rounded-lg bg-slate-100 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Treatment Package</p>
              <select className="w-full rounded-lg bg-white p-3 text-sm" value={formData.packageType} onChange={(e) => update("packageType", e.target.value)}>
                <option>Standard IVF</option>
                <option>Premium IVF + ICSI</option>
                <option>Embryo Banking Plan</option>
              </select>
            </div>
            <div className="rounded-lg bg-slate-100 p-4 md:col-span-2">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Payment Plan</p>
              <select className="w-full rounded-lg bg-white p-3 text-sm" value={formData.paymentPlan} onChange={(e) => update("paymentPlan", e.target.value)}>
                <option>Monthly Installments</option>
                <option>Two-Phase Payment</option>
                <option>Full Advance</option>
              </select>
            </div>
            <div className="rounded-lg bg-slate-100 p-4 md:col-span-2">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">E-Signature</p>
              <input className="w-full rounded-lg bg-white p-3 text-sm" placeholder="Type full legal name" value={formData.eSignature} onChange={(e) => update("eSignature", e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h4 className="mb-5 text-lg font-bold text-[#1A237E]">Review & Confirm</h4>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div className="rounded-lg bg-slate-100 p-4">
              <p className="font-bold text-slate-700">Partner 1</p>
              <p>{formData.partner1FirstName} {formData.partner1LastName}</p>
              <p>{formData.partner1Dob || "DOB pending"}</p>
              <p>{formData.partner1Sex || "Sex pending"}</p>
            </div>
            <div className="rounded-lg bg-slate-100 p-4">
              <p className="font-bold text-slate-700">Partner 2</p>
              <p>{formData.partner2FirstName} {formData.partner2LastName}</p>
              <p>{formData.partner2Dob || "DOB pending"}</p>
              <p>{formData.partner2Sex || "Sex pending"}</p>
            </div>
            <div className="rounded-lg bg-slate-100 p-4 md:col-span-2">
              <p className="font-bold text-slate-700">Financial Summary</p>
              <p>Insurance: {formData.hasInsurance === "yes" ? "Available" : "Not Available"}</p>
              <p>Package: {formData.packageType}</p>
              <p>Payment Plan: {formData.paymentPlan}</p>
              <p>E-Signature: {formData.eSignature || "Pending"}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-200 pt-6">
        <Button variant="secondary" className="rounded-lg" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
          Previous
        </Button>

        {step < 3 ? (
          <Button className="rounded-lg bg-[#1A237E] hover:bg-[#111a63]" onClick={() => setStep((s) => Math.min(3, s + 1))}>
            Next Step
          </Button>
        ) : (
          <Button className="rounded-lg bg-[#1A237E] hover:bg-[#111a63]" disabled={!canSubmit} onClick={() => setSubmitted(true)}>
            Confirm & Create Profile
          </Button>
        )}
      </div>
    </div>
  );
}
