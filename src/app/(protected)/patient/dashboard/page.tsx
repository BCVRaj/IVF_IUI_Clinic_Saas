"use client";

import { useEffect, useState } from "react";
import { CalendarDays, MessageSquareText, Upload } from "lucide-react";

import { CycleStepper } from "@/components/patient/cycle-stepper";
import { MedicationCard } from "@/components/patient/medication-card";
import { StatusBadge } from "@/components/patient/status-badge";
import { Button } from "@/components/ui/button";
import {
  patientCycleSteps,
  patientRecentLabReports,
  patientUpcomingAppointment,
} from "@/lib/mock-patient-data";

export default function PatientDashboardPage() {
  const [patient, setPatient] = useState<any>(null);
  const [medications, setMedications] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, medsRes] = await Promise.all([
          fetch("/api/patient/profile"),
          fetch("/api/patient/medications"),
        ]);
        if (profileRes.ok) {
          const json = await profileRes.json();
          setPatient(json.data || null);
        }
        if (medsRes.ok) {
          const json = await medsRes.json();
          setMedications(json.data || []);
        }
      } catch (_) {}
    };
    load();
  }, []);

  const firstName = patient?.first_name || "there";
  const cycleName = patient?.medical_history?.packageType || "IVF Stimulation Protocol";

  // Map API medication to MedicationCard props
  const todayMeds = medications.slice(0, 3).map((m: any) => ({
    id: m.id,
    name: m.medication_name,
    dose: m.dose,
    time: m.frequency || "Daily",
    status: m.medication_adherence?.[0]?.status === "TAKEN" ? "Taken" : "Pending",
  }));

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
          Current Status
        </p>
        <h1 className="text-3xl font-extrabold text-slate-900">
          Good morning, {firstName}. You&apos;re making great progress.
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-600">
          Keep following your medication schedule and stay hydrated.
        </p>
        <div className="mt-5 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-800">
          Active Cycle: {cycleName}
        </div>
      </section>

      <CycleStepper steps={patientCycleSteps} />

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <article className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-8">
          <h2 className="text-xl font-bold text-slate-900">Next Appointment</h2>
          <p className="text-sm text-slate-500">{patientUpcomingAppointment.type}</p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <div className="rounded-lg bg-emerald-700 px-4 py-3 text-white">
              <p className="text-xs uppercase">Date</p>
              <p className="text-sm font-bold">{patientUpcomingAppointment.dateLabel}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-800">
                {patientUpcomingAppointment.timeLabel}
              </p>
              <p className="text-sm text-slate-500">{patientUpcomingAppointment.weekday}</p>
            </div>
            <div className="ml-auto">
              <Button variant="secondary" className="rounded-full">Reschedule</Button>
            </div>
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-700">{patientUpcomingAppointment.doctor}</p>
          <p className="text-sm text-slate-500">{patientUpcomingAppointment.specialty}</p>
        </article>

        <article className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent Lab Reports</h2>
            <button className="text-xs font-bold text-emerald-700">View All</button>
          </div>
          <div className="space-y-3">
            {patientRecentLabReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-3">
                <div>
                  <p className="text-sm font-bold">{report.name}</p>
                  <p className="text-xs text-slate-500">{report.date}</p>
                </div>
                <StatusBadge label={report.status} tone={report.status === "Ready" ? "success" : "neutral"} />
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">Today&apos;s Medications</h2>
        </div>
        {todayMeds.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {todayMeds.map((med) => (
              <MedicationCard key={med.id} {...med} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No medications prescribed yet.</p>
        )}
      </section>

      <section className="flex flex-wrap gap-3">
        <Button className="rounded-full bg-emerald-700 hover:bg-emerald-600">
          <MessageSquareText className="size-4" />
          Log Symptom
        </Button>
        <Button variant="secondary" className="rounded-full bg-emerald-100 text-emerald-900">
          <Upload className="size-4" />
          Upload Report
        </Button>
        <Button variant="secondary" className="rounded-full">
          <CalendarDays className="size-4" />
          Message Nurse
        </Button>
      </section>
    </div>
  );
}
