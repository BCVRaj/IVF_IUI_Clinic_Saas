import { Search } from "lucide-react";

import { StatusBadge } from "@/components/patient/status-badge";
import { Button } from "@/components/ui/button";
import { labQueue } from "@/lib/mock-nurse-data";

export default function NurseLabReportsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-extrabold tracking-tight text-[#000666]">
          Lab Report Uploader
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Submit diagnostics for physician review and protocol adjustment.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <article className="space-y-6 rounded-xl bg-slate-100 p-6 lg:col-span-5">
          <div>
            <h3 className="text-lg font-bold text-[#1A237E]">Patient Context</h3>
            <div className="mt-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-lg bg-white py-3 pl-10 pr-3 text-sm"
                  placeholder="Select Patient (MRN/Name)"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-200 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Ordered By</p>
                  <p className="text-sm font-semibold text-slate-800">Dr. Amelia Thorne</p>
                </div>
                <div className="rounded-lg bg-slate-200 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Priority</p>
                  <StatusBadge label="Routine" tone="neutral" />
                </div>
              </div>
            </div>
          </div>

          <div className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-center hover:bg-[#e0e0ff]/40">
            <p className="text-lg font-bold text-slate-800">Drag & Drop Lab Results</p>
            <p className="mt-1 text-xs text-slate-500">PDF, HL7, or DICOM up to 50MB</p>
            <Button className="mt-6 rounded-lg bg-[#1A237E] hover:bg-[#111a63]">
              Browse Files
            </Button>
          </div>
        </article>

        <article className="space-y-5 lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#1A237E]">Parsing Queue</h2>
            <div className="flex gap-2">
              <StatusBadge label="2 In Progress" tone="warning" />
              <StatusBadge label="3 Completed" tone="success" />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-100 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                <tr>
                  <th className="px-6 py-4">Document</th>
                  <th className="px-4 py-4">Patient / MRN</th>
                  <th className="px-4 py-4">Parsing Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {labQueue.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{row.file}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-slate-800">{row.patient}</p>
                      <p className="text-[10px] font-bold text-slate-500">{row.mrn}</p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge
                        label={row.status}
                        tone={
                          row.status === "Ready for Review"
                            ? "success"
                            : row.status === "Parsing Error"
                              ? "danger"
                              : "warning"
                        }
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded-md bg-[#1A237E] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-[#111a63]">
                        {row.action}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-xl bg-[#1A237E] p-6 text-white">
            <h4 className="text-lg font-bold">Clinic Protocol Note</h4>
            <p className="mt-2 text-sm text-indigo-100">
              Ensure hormone panel results are forwarded directly to the nursing
              lead for dosage adjustments. STAT flags trigger physician alerts.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
