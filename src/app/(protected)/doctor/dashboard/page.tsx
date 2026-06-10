"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  doctorAlerts,
  doctorStats,
} from "@/lib/mock-doctor-data";
import Link from 'next/link';

type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  gender?: string;
  age?: number;
  onboarding_status?: string;
};

function OnboardingBadge({ status }: { status?: string }) {
  if (status === "CLEARED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-green-700">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Cleared
      </span>
    );
  }
  if (status === "PENDING_VERIFICATION") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      Incomplete
    </span>
  );
}

export default function DoctorDashboardPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch("/api/doctor/patients");
        if (!res.ok) return;
        const json = await res.json();
        setPatients(json.data || []);
      } catch (err) {
        console.error("Failed to load patients:", err);
      } finally {
        setPatientsLoading(false);
      }
    };
    fetchPatients();
  }, []);

  return (
    <div className="space-y-10 bg-background text-on-surface">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Clinical Overview</h2>
        <p className="text-sm text-on-surface-variant">Laboratory Operations Active</p>
      </div>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {[
          { id: "d1", label: "Patients Today", value: patients.length.toString(), detail: "Currently registered", tone: "navy" },
          { id: "d2", label: "Critical Cases", value: doctorAlerts.filter(a => a.severity === 'critical').length.toString().padStart(2, '0'), detail: "Requires intervention", tone: "red" },
          { id: "d3", label: "Pending Patients KYC", value: patients.filter(p => p.onboarding_status !== "CLEARED").length.toString().padStart(2, '0'), detail: "Needs review", tone: "teal" },
          { id: "d4", label: "Active IVF Cycles", value: "28", detail: "Across all units", tone: "dark" },
        ].map((stat) => (
          <article
            key={stat.id}
            className={`min-h-[130px] p-6 rounded-xl relative overflow-hidden backdrop-blur-md ${
              stat.tone === "red"
                ? "bg-error/10 text-error shadow-[0_8px_32px_rgba(186,26,26,0.04)]"
                : stat.tone === "dark"
                  ? "bg-surface-dim text-on-surface shadow-[0_8px_32px_rgba(25,28,30,0.04)]"
                  : "bg-surface-lowest shadow-[0_8px_32px_rgba(25,28,30,0.04)]"
            }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest opacity-75">{stat.label}</p>
            <div className="mt-4 flex items-end justify-between">
              <p className="text-4xl font-extrabold tracking-tighter">{stat.value}</p>
              <p className="text-[10px] font-bold">{stat.detail}</p>
            </div>
            {stat.tone === "dark" && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary to-primary-container" />
            )}
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Patient List</h3>
            <div className="flex gap-2">
              <Button variant="secondary" className="rounded-md text-[11px] uppercase tracking-wider bg-surface-lowest border border-outline-variant/15 text-on-surface hover:bg-surface-low shadow-none">
                Filter
              </Button>
              <Button asChild className="rounded-md bg-gradient-to-r from-primary to-primary-container text-[11px] uppercase tracking-wider text-primary-foreground hover:opacity-90 shadow-none">
                <Link href="/doctor/add-record">Add Record</Link>
              </Button>
            </div>
          </div>

          <div className="overflow-hidden bg-surface-lowest rounded-xl shadow-[0_8px_32px_rgba(25,28,30,0.04)]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-low text-[10px] uppercase tracking-widest text-on-surface-variant">
                  <th className="px-6 py-4">Patient Name</th>
                  <th className="px-6 py-4">Patient ID</th>
                  <th className="px-6 py-4">Gender</th>
                  <th className="px-6 py-4">Age</th>
                  <th className="px-6 py-4">Onboarding</th>
                  <th className="px-6 py-4 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-low overflow-hidden">
                {patientsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-sm text-on-surface-variant text-center">
                      Loading patients...
                    </td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-sm text-on-surface-variant text-center">
                      No patients assigned yet. Nurses can onboard new patients via the Nurse Portal.
                    </td>
                  </tr>
                ) : (
                  patients.map((patient) => {
                    return (
                      <tr key={patient.id} className="hover:bg-surface transition-colors duration-200">
                        <td className="px-6 py-5">
                          <p className="font-bold">{patient.first_name} {patient.last_name}</p>
                          <p className="text-xs text-on-surface-variant">{patient.email}</p>
                        </td>
                        <td className="px-6 py-5 text-sm font-bold text-on-surface">{patient.id}</td>
                        <td className="px-6 py-5 text-sm text-on-surface-variant">{patient.gender ?? "—"}</td>
                        <td className="px-6 py-5 text-sm text-on-surface-variant">{patient.age ?? "—"}</td>
                        <td className="px-6 py-5">
                          <OnboardingBadge status={patient.onboarding_status} />
                        </td>
                        <td className="px-6 py-5 text-right">
                          <Link
                            href={`/doctor/ehr/${patient.id}`}
                            className="inline-block border border-outline-variant/15 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-on-surface hover:bg-surface hover:text-primary transition-colors duration-200"
                          >
                            Open EHR
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-4 lg:col-span-4 bg-surface-highest p-6 rounded-xl">
          <h3 className="text-xl font-bold">Critical Alerts</h3>
          {doctorAlerts.map((alert) => (
            <article
              key={alert.id}
              className="p-5 rounded-md relative overflow-hidden backdrop-blur-md shadow-[0_8px_32px_rgba(25,28,30,0.04)] bg-surface-lowest"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${alert.severity === 'critical' ? 'bg-error' : 'bg-tertiary'}`} />
              <p className={`text-[10px] font-extrabold uppercase tracking-widest ${alert.severity === 'critical' ? 'text-error' : 'text-tertiary'}`}>
                {alert.title}
              </p>
              <p className="mt-1 font-bold text-on-surface headline-sm">{alert.patient}</p>
              <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">{alert.message}</p>
            </article>
          ))}
        </aside>
      </section>
    </div>
  );
}
