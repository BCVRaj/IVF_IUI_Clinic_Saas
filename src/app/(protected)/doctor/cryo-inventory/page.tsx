import { Snowflake } from "lucide-react";

import { StatusBadge } from "@/components/patient/status-badge";
import { cryoSamples, cryoTanks } from "@/lib/mock-doctor-data";

export default function DoctorCryoInventoryPage() {
  return (
    <div className="space-y-6 bg-slate-950 text-slate-50">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#93CDFC]">
            Cryogenic Storage Operations
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-50">Cryo Inventory</h2>
        </div>
        <div className="flex gap-2">
          <button className="rounded bg-[#00527b] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#cbe6ff]">
            Thaw/Discard
          </button>
          <button className="rounded bg-gradient-to-r from-white to-[#93CDFC] px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#111318]">
            Add Sample
          </button>
        </div>
      </header>

      <section className="grid grid-cols-12 gap-6">
        <article className="col-span-12 rounded-xl border border-slate-800 bg-slate-900 p-6 lg:col-span-8">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-50">Cryo-Storage Map: Sector A</h3>
            <div className="flex gap-3 text-[10px] uppercase tracking-wider text-slate-300">
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#93CDFC]" /> Occupied</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-slate-700" /> Available</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#ffb4ab]" /> Alert</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {cryoTanks.map((tank) => (
              <article key={tank.id} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                <div className="mb-4 flex items-start justify-between">
                  <p className="text-[10px] font-black text-[#93CDFC]">{tank.id}</p>
                  <p className={`text-[10px] ${tank.alert ? "font-bold text-[#ffb4ab]" : "text-slate-300"}`}>
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
                            ? "animate-pulse bg-[#ffb4ab]"
                            : filled
                              ? "bg-[#93CDFC]"
                              : "bg-slate-700"
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
                  <p className="text-[10px] uppercase tracking-widest text-slate-300">Capacity</p>
                  <p className="text-xs font-bold text-slate-50">{tank.capacity}%</p>
                </div>
              </article>
            ))}
          </div>
        </article>

        <aside className="col-span-12 space-y-4 lg:col-span-4">
          <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-300">Storage Vitality</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-300">Total Samples</p>
                  <p className="text-2xl font-black text-slate-50">14,208</p>
                </div>
                <div className="rounded bg-[#00527b]/30 p-2 text-[#93CDFC]"><Snowflake className="size-4" /></div>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest">
                  <span className="text-slate-300">Canister Utilization</span>
                  <span className="text-[#93CDFC]">78%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded bg-slate-700">
                  <div className="h-full w-[78%] bg-[#93CDFC]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded border border-slate-800 bg-slate-900 p-3">
                  <p className="text-[9px] uppercase tracking-widest text-slate-300">Frozen Today</p>
                  <p className="text-lg font-bold text-slate-50">+24</p>
                </div>
                <div className="rounded border border-slate-800 bg-slate-900 p-3">
                  <p className="text-[9px] uppercase tracking-widest text-slate-300">Thawed Today</p>
                  <p className="text-lg font-bold text-slate-50">-12</p>
                </div>
              </div>
            </div>
          </article>
        </aside>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-6 py-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-50">Specimen Registry</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-slate-900 text-[10px] uppercase tracking-widest text-slate-300">
              <tr>
                <th className="px-6 py-4">Patient / Identifier</th>
                <th className="px-6 py-4">Specimen Type</th>
                <th className="px-6 py-4 text-center">Grade</th>
                <th className="px-6 py-4">Location Code</th>
                <th className="px-6 py-4">Freeze Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {cryoSamples.map((sample) => (
                <tr key={sample.id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-50">{sample.patient}</p>
                    <p className="text-[10px] tracking-wider text-slate-300">REF: {sample.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-tight text-[#93CDFC]">
                      {sample.specimen}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-black text-slate-50">{sample.grade}</td>
                  <td className="px-6 py-4 font-mono text-xs text-[#93CDFC]">{sample.location}</td>
                  <td className="px-6 py-4 text-xs text-slate-300">{sample.freezeDate}</td>
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
