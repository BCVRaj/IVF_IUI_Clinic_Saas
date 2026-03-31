import { Snowflake } from "lucide-react";

import { StatusBadge } from "@/components/patient/status-badge";
import { cryoSamples, cryoTanks } from "@/lib/mock-doctor-data";

export default function DoctorCryoInventoryPage() {
  return (
    <div className="space-y-6 bg-background text-on-surface">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Cryogenic Storage Operations
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-primary">Cryo Inventory</h2>
        </div>
        <div className="flex gap-2">
          <button className="rounded bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/20 shadow-none">
            Thaw/Discard
          </button>
          <button className="rounded bg-gradient-to-r from-primary to-primary-container px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary-foreground hover:opacity-90 shadow-none">
            Add Sample
          </button>
        </div>
      </header>

      <section className="grid grid-cols-12 gap-6">
        <article className="col-span-12 rounded-xl border border-surface-dim/30 bg-surface-lowest p-6 lg:col-span-8 shadow-[0_8px_32px_rgba(25,28,30,0.04)] backdrop-blur-md">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface">Cryo-Storage Map: Sector A</h3>
            <div className="flex gap-3 text-[10px] uppercase tracking-wider text-on-surface-variant">
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-primary" /> Occupied</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-surface" /> Available</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-error" /> Alert</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {cryoTanks.map((tank) => (
              <article key={tank.id} className="rounded-lg border border-surface-dim/30 bg-surface p-4 shadow-sm">
                <div className="mb-4 flex items-start justify-between">
                  <p className="text-[10px] font-black text-primary">{tank.id}</p>
                  <p className={`text-[10px] ${tank.alert ? "font-bold text-error" : "text-on-surface-variant"}`}>
                    LN2: {tank.temp}
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {Array.from({ length: 8 }).map((_, idx) => {
                    const filled = idx < tank.occupied;
                    const alerted = tank.alert && idx === tank.occupied - 1;
                    return (
                      <div
                        key={idx}
                        className={`aspect-square rounded-sm ${
                          alerted
                            ? "animate-pulse bg-error"
                            : filled
                              ? "bg-primary"
                              : "bg-surface-dim"
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-surface-low pt-3">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Capacity</p>
                  <p className="text-xs font-bold text-on-surface">{tank.capacity}%</p>
                </div>
              </article>
            ))}
          </div>
        </article>

        <aside className="col-span-12 space-y-4 lg:col-span-4">
          <article className="rounded-xl border border-surface-dim/30 bg-surface-lowest p-5 shadow-[0_8px_32px_rgba(25,28,30,0.04)] backdrop-blur-md">
            <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Storage Vitality</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-on-surface-variant">Total Samples</p>
                  <p className="text-2xl font-black text-on-surface">14,208</p>
                </div>
                <div className="rounded bg-primary/20 p-2 text-primary"><Snowflake className="size-4" /></div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest">
                  <span className="text-on-surface-variant">Canister Utilization</span>
                  <span className="text-primary">78%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded bg-surface-dim">
                  <div className="h-full w-[78%] bg-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded border border-surface-dim/30 bg-surface p-3 shadow-sm">
                  <p className="text-[9px] uppercase tracking-widest text-on-surface-variant">Frozen Today</p>
                  <p className="text-lg font-bold text-on-surface">+24</p>
                </div>
                <div className="rounded border border-surface-dim/30 bg-surface p-3 shadow-sm">
                  <p className="text-[9px] uppercase tracking-widest text-on-surface-variant">Thawed Today</p>
                  <p className="text-lg font-bold text-on-surface">-12</p>
                </div>
              </div>
            </div>
          </article>
        </aside>
      </section>

      <section className="overflow-hidden rounded-xl border border-surface-dim/30 bg-surface-lowest shadow-[0_8px_32px_rgba(25,28,30,0.04)] backdrop-blur-md">
        <div className="border-b border-surface-low px-6 py-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface">Specimen Registry</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-surface text-[10px] uppercase tracking-widest text-on-surface-variant">
              <tr>
                <th className="px-6 py-4">Patient / Identifier</th>
                <th className="px-6 py-4">Specimen Type</th>
                <th className="px-6 py-4 text-center">Grade</th>
                <th className="px-6 py-4">Location Code</th>
                <th className="px-6 py-4">Freeze Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-low text-sm">
              {cryoSamples.map((sample) => (
                <tr key={sample.id} className="hover:bg-surface transition-colors duration-200">
                  <td className="px-6 py-4">
                    <p className="font-bold text-on-surface">{sample.patient}</p>
                    <p className="text-[10px] tracking-wider text-on-surface-variant">REF: {sample.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded bg-primary/15 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-primary">
                      {sample.specimen}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-black text-on-surface">{sample.grade}</td>
                  <td className="px-6 py-4 font-mono text-xs text-primary">{sample.location}</td>
                  <td className="px-6 py-4 text-xs text-on-surface-variant">{sample.freezeDate}</td>
                  <td className="px-6 py-4">
                    <StatusBadge
                      label={sample.status}
                      tone={
                        sample.status === "Stored"
                          ? "success"
                          : sample.status === "Processing"
                            ? "warning"
                            : "danger"
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
