"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/patient/status-badge";

type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  onboarding_status: string;
  nartsr_id?: string;
  marriage_cert_verified?: boolean;
};

export default function VerificationQueuePage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/nurse/patients", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          // Filter only patients pending verification or incomplete
          const queue = json.data.filter(
            (p: Patient) => p.onboarding_status !== "CLEARED"
          );
          setPatients(queue);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Regulatory Verification Queue
        </h1>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading queue...</p>
      ) : patients.length === 0 ? (
        <div className="rounded-xl bg-white p-8 shadow-sm text-center">
          <p className="text-slate-600">All patients have been cleared. Queue is empty.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">NARTSR ID</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-medium text-slate-900">
                    {p.first_name} {p.last_name}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge 
                      label={p.onboarding_status.replace(/_/g, " ")} 
                      tone={p.onboarding_status === "CLEARED" ? "success" : p.onboarding_status === "PENDING_VERIFICATION" ? "warning" : "danger"} 
                    />
                  </td>
                  <td className="px-5 py-4">
                    {p.nartsr_id ? (
                      <span className="text-green-700 font-mono text-xs font-bold">{p.nartsr_id}</span>
                    ) : (
                      <span className="text-slate-400 text-xs">Missing</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <Link
                      href={`/nurse/patients/${p.id}`}
                      className="text-xs font-bold text-teal-600 hover:text-teal-800"
                    >
                      Review & Verify →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
