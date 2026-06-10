"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/patient/status-badge";
import { Button } from "@/components/ui/button";
import { nurseStats } from "@/lib/mock-nurse-data";

// ─── Types ────────────────────────────────────────────────────────────────────

type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  onboarding_status?: string;
};

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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NurseDashboardPage() {
  // ── Patient list state ──
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);

  // ── Assigned tasks state ──
  const [assignedTasks, setAssignedTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Fetch patients ──
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch("/api/nurse/patients");
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

  // ── Fetch tasks (auto-refresh every 10 s) ──
  const fetchTasks = useCallback(async () => {
    try {
      setTasksLoading(true);
      const response = await fetch("/api/nurse/tasks");
      if (!response.ok) throw new Error("Failed to fetch nurse tasks");
      const data = await response.json();
      setAssignedTasks(data.data || []);
      setTasksError(null);
    } catch (err: any) {
      console.error("Error fetching nurse tasks:", err);
      setTasksError(err.message || "Error loading tasks");
      setAssignedTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 10000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  // ── Task actions ──
  const acknowledgeTask = async (taskId: string) => {
    try {
      setActionLoading(taskId + "-ack");
      const res = await fetch(`/api/nurse/tasks/${taskId}/acknowledge`, { method: "PUT" });
      if (!res.ok) throw new Error("Failed to acknowledge task");
      await fetchTasks();
    } catch (err: any) {
      console.error("Acknowledge error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const completeTask = async (taskId: string) => {
    try {
      setActionLoading(taskId + "-complete");
      const res = await fetch(`/api/nurse/tasks/${taskId}/complete`, { method: "PUT" });
      if (!res.ok) throw new Error("Failed to complete task");
      await fetchTasks();
    } catch (err: any) {
      console.error("Complete error:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Task formatting (identical to previous dashboard) ──
  const formatTask = (task: any) => ({
    ...task,
    patientName: task.patients
      ? `${task.patients.first_name ?? ""} ${task.patients.last_name ?? ""}`.trim() || "Unknown Patient"
      : "Unknown Patient",
    createdBy: task.user_profiles
      ? `${task.user_profiles.first_name ?? ""} ${task.user_profiles.last_name ?? ""}`.trim() || "Unknown Doctor"
      : "Unknown Doctor",
    priority: task.priority === "URGENT" || task.priority === "HIGH" ? "Critical" : "Normal",
    dueDate: task.due_date ? new Date(task.due_date).toLocaleDateString() : "N/A",
  });

  return (
    <div className="space-y-8 bg-background text-on-surface">
      {/* ── Page Header ── */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">
            Clinic Operations
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Real-time patient flow and clinical logistics.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary" className="rounded-md border border-outline-variant/15 bg-surface-lowest text-[11px] uppercase tracking-wider text-on-surface hover:bg-surface-low shadow-none">
            <Link href="/nurse/verification">Verification Queue</Link>
          </Button>
          <Button asChild className="rounded-md bg-gradient-to-r from-primary to-primary-container text-[11px] uppercase tracking-wider text-primary-foreground hover:opacity-90 shadow-none">
            <Link href="/nurse/onboarding">New Patient</Link>
          </Button>
        </div>
      </header>

      {/* ── Stats Row ── */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { id: "s1", label: "Total patients today", value: patients.length.toString(), detail: "Currently active", tone: "primary" },
          { id: "s2", label: "Pending Patients KYC", value: patients.filter(p => p.onboarding_status !== "CLEARED").length.toString().padStart(2, '0'), detail: "Awaiting verification", tone: "secondary" },
          { id: "s3", label: "Pending Assigned Tasks", value: assignedTasks.filter(t => t.status !== "COMPLETED").length.toString().padStart(2, '0'), detail: "Needs attention", tone: "accent" },
        ].map((stat) => (
          <article key={stat.id} className="rounded-xl border-l-[3px] border-secondary bg-surface-lowest p-5 relative overflow-hidden backdrop-blur-md shadow-[0_8px_32px_rgba(25,28,30,0.04)]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              {stat.label}
            </p>
            <div className="mt-1 flex items-end gap-2">
              <p className="text-3xl font-black text-primary">{stat.value}</p>
              <p className="text-xs font-semibold text-on-surface-variant">{stat.detail}</p>
            </div>
          </article>
        ))}
      </section>

      {/* ── 70 / 30 Split ── */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">

        {/* ── LEFT 70% — Patient List ── */}
        <div className="space-y-4 lg:col-span-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Patient List</h2>
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
                      Loading patients…
                    </td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-sm text-on-surface-variant text-center">
                      No patients assigned yet.
                    </td>
                  </tr>
                ) : (
                  patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-surface transition-colors duration-200">
                      <td className="px-6 py-5">
                        <p className="font-bold">{patient.first_name} {patient.last_name}</p>
                        <p className="text-xs text-on-surface-variant">{patient.email}</p>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-on-surface">{patient.id}</td>
                      <td className="px-6 py-5 text-sm text-on-surface-variant">{patient.gender ?? "—"}</td>
                      <td className="px-6 py-5 text-sm text-on-surface-variant">{computeAge(patient.date_of_birth)}</td>
                      <td className="px-6 py-5">
                        <OnboardingBadge status={patient.onboarding_status} />
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Link
                          href={`/nurse/ehr/${patient.id}`}
                          className="inline-block border border-outline-variant/15 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider text-on-surface hover:bg-surface hover:text-primary transition-colors duration-200"
                        >
                          Open EHR
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── RIGHT 30% — Assigned Tasks ── */}
        <aside className="lg:col-span-4">
          <div className="rounded-xl bg-surface-lowest shadow-[0_8px_32px_rgba(25,28,30,0.04)] backdrop-blur-md overflow-hidden">
            <div className="flex items-center justify-between bg-surface px-5 py-4 border-b border-surface-dim/30">
              <h2 className="text-base font-bold text-primary">Assigned Tasks</h2>
              {assignedTasks.length > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                  {assignedTasks.length} task{assignedTasks.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Loading */}
            {tasksLoading && (
              <div className="p-5">
                <p className="text-sm text-on-surface-variant">Loading tasks…</p>
              </div>
            )}

            {/* Error */}
            {tasksError && !tasksLoading && (
              <div className="p-5">
                <p className="text-sm text-red-500">Error: {tasksError}</p>
              </div>
            )}

            {/* Empty */}
            {!tasksLoading && !tasksError && assignedTasks.length === 0 && (
              <div className="p-5">
                <p className="text-sm text-on-surface-variant">No tasks assigned at this time.</p>
              </div>
            )}

            {/* Task cards */}
            {!tasksLoading && assignedTasks.length > 0 && (
              <div className="divide-y divide-surface-low max-h-[70vh] overflow-y-auto">
                {assignedTasks.map((task: any) => {
                  const formatted = formatTask(task);
                  return (
                    <div key={task.id} className="p-5 hover:bg-surface transition-colors duration-200">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-bold text-primary truncate">{formatted.patientName}</h3>
                            {task.acknowledged && (
                              <CheckCircle2 className="size-3.5 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant">
                            <span className="font-semibold">{task.title}</span>
                          </p>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">
                            By: {formatted.createdBy}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <StatusBadge
                            label={formatted.priority}
                            tone={formatted.priority === "Critical" ? "danger" : "warning"}
                          />
                          <span className="text-[10px] font-semibold text-on-surface-variant">
                            Due: {formatted.dueDate}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-2">
                        {!task.acknowledged && task.status !== "COMPLETED" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={actionLoading === task.id + "-ack"}
                            onClick={() => acknowledgeTask(task.id)}
                            className="text-[10px] h-7 px-2.5 flex-1"
                          >
                            {actionLoading === task.id + "-ack" ? "…" : "Acknowledge"}
                          </Button>
                        )}
                        {task.status !== "COMPLETED" && (
                          <Button
                            size="sm"
                            disabled={actionLoading === task.id + "-complete"}
                            onClick={() => completeTask(task.id)}
                            className="text-[10px] h-7 px-2.5 flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            {actionLoading === task.id + "-complete" ? "…" : "Complete"}
                          </Button>
                        )}
                        {task.status === "COMPLETED" && (
                          <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="size-3.5" /> Done
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
