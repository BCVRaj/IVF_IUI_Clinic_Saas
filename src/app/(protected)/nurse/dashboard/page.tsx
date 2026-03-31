import { AlertTriangle, Flag, CheckCircle2, Clock } from "lucide-react";
import Link from 'next/link';

import { StatusBadge } from "@/components/patient/status-badge";
import { Button } from "@/components/ui/button";
import {
  nurseAlerts,
  nurseQueue,
  nurseStats,
  nurseTimeline,
} from "@/lib/mock-nurse-data";
import { coordinationTasks } from "@/lib/mock-doctor-data";

export default function NurseDashboardPage() {
  // Current nurse ID (in mock data, Elena Rodriguez)
  const currentNurseId = "nurse_001";
  
  // Get all tasks assigned to current nurse across all statuses
  const assignedTasks = [
    ...coordinationTasks.pending,
    ...coordinationTasks.progress,
    ...coordinationTasks.done
  ].filter((task: any) => task.assignedNurseId === currentNurseId);

  return (
    <div className="space-y-8 bg-background text-on-surface">
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
          <Button variant="secondary" className="rounded-md border border-outline-variant/15 bg-surface-lowest text-[11px] uppercase tracking-wider text-on-surface hover:bg-surface-low shadow-none">
            Export Log
          </Button>
          <Button asChild className="rounded-md bg-gradient-to-r from-primary to-primary-container text-[11px] uppercase tracking-wider text-primary-foreground hover:opacity-90 shadow-none">
            <Link href="/nurse/check-in">New Check-in</Link>
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {nurseStats.map((stat) => (
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

      {/* Physician-Assigned Tasks */}
      {assignedTasks.length > 0 && (
        <section className="rounded-xl bg-surface-lowest shadow-[0_8px_32px_rgba(25,28,30,0.04)] backdrop-blur-md overflow-hidden">
          <div className="flex items-center justify-between bg-surface px-6 py-4 border-b border-surface-dim/30">
            <h2 className="text-lg font-bold text-primary">Assigned Tasks</h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
              {assignedTasks.length} task{assignedTasks.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="divide-y divide-surface-low">
            {assignedTasks.map((task: any) => (
              <div key={task.id} className="p-6 hover:bg-surface transition-colors duration-200">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-bold text-primary">{task.task}</h3>
                      {task.acknowledged && (
                        <CheckCircle2 className="size-4 text-green-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-on-surface-variant">
                      Patient: <span className="font-semibold text-on-surface">{task.patientName}</span>
                    </p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Assigned by: {task.createdBy}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`font-bold text-sm px-3 py-1 rounded-full ${
                      task.priority === "Critical" ? "bg-error/20 text-error" : "bg-secondary/20 text-secondary"
                    }`}>
                      {task.priority}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold">
                      <Clock className="size-3.5" />
                      {task.due}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-low">
                  <div className="text-xs">
                    {task.acknowledged ? (
                      <span className="text-green-700 font-semibold">
                        ✓ Acknowledged at {task.acknowledgmentTime}
                      </span>
                    ) : (
                      <span className="text-on-surface-variant">Awaiting acknowledgment</span>
                    )}
                  </div>
                  {!task.acknowledged && (
                    <Button className="text-xs font-bold uppercase bg-primary text-primary-foreground hover:opacity-90 shadow-none">
                      Acknowledge
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-12 gap-6">
        <article className="col-span-12 overflow-hidden rounded-xl bg-surface-lowest shadow-[0_8px_32px_rgba(25,28,30,0.04)] lg:col-span-8 backdrop-blur-md">
          <div className="flex items-center justify-between bg-surface px-6 py-4 border-b border-surface-dim/30">
            <h2 className="text-lg font-bold text-primary">Active Patient Queue</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-surface-low text-[10px] uppercase tracking-widest text-on-surface-variant">
                <tr>
                  <th className="px-6 py-3">Patient Identity</th>
                  <th className="px-6 py-3">Cycle Stage</th>
                  <th className="px-6 py-3">Next Action Needed</th>
                  <th className="px-6 py-3 text-right">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-low bg-surface-lowest">
                {nurseQueue.map((row) => (
                  <tr key={row.id} className="hover:bg-surface transition-colors duration-200">
                    <td className="px-6 py-4">
                      <Link href={`/nurse/patient/${row.id}`} className="block text-sm font-bold text-primary hover:underline">
                        {row.name}
                      </Link>
                      <p className="text-[10px] font-medium uppercase tracking-widest text-on-surface-variant">
                        ID: #{row.id}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-on-surface">{row.stage}</td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant">{row.action}</td>
                    <td className="px-6 py-4 text-right">
                      {row.priority === "High" ? (
                        <Flag className="ml-auto size-4 fill-error text-error" />
                      ) : (
                        <Flag className="ml-auto size-4 text-on-surface-variant/40" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="col-span-12 space-y-5 lg:col-span-4">
          <article className="rounded-xl bg-error/10 p-5 text-error shadow-[0_8px_32px_rgba(186,26,26,0.04)]">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider">
              <AlertTriangle className="size-4" />
              Clinical Alerts
            </h3>
            <div className="space-y-3">
              {nurseAlerts.map((alert) => (
                <div key={alert.id} className="rounded-lg border-l-[3px] border-error bg-surface-lowest p-3 relative shadow-sm">
                  <p className="text-xs font-bold text-error">{alert.title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-on-surface">{alert.body}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl bg-surface-lowest p-5 shadow-[0_8px_32px_rgba(25,28,30,0.04)]">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-bold text-primary">Timeline</h3>
              <StatusBadge label="Today" />
            </div>
            <div className="space-y-4 border-l-[3px] border-surface-low pl-5 ml-1">
              {nurseTimeline.map((item) => (
                <div key={item.id} className="relative">
                  <span
                    className={`absolute -left-[27px] top-1 size-3 rounded-full border-2 border-surface-lowest ${
                      item.active ? "bg-secondary" : "bg-surface-dim"
                    }`}
                  />
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    {item.time} — {item.place}
                  </p>
                  <p className="text-sm font-bold text-on-surface">{item.title}</p>
                  <p className="text-xs text-on-surface-variant">{item.patient}</p>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
