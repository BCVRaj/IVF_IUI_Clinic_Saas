import { UploadCloud } from "lucide-react";

import { StatusBadge } from "@/components/patient/status-badge";
import { Button } from "@/components/ui/button";
import { uploadedReports } from "@/lib/mock-patient-data";

export default function PatientLabReportsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900">Lab Report Uploader</h1>
        <p className="mt-2 text-slate-600">
          Securely upload your reports for AI parsing and clinical review.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <article className="rounded-2xl border-2 border-dashed border-emerald-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <UploadCloud className="size-8" />
            </div>
            <h2 className="text-xl font-bold">Drop your PDF or image here</h2>
            <p className="mt-2 text-sm text-slate-500">
              Hormonal, semen, and genetic reports supported. Max 10MB.
            </p>
            <Button className="mt-6 rounded-full bg-emerald-700 hover:bg-emerald-600">
              Browse Files
            </Button>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold">Report Metadata</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Report Type
                </label>
                <select className="w-full rounded-lg bg-slate-100 p-3 text-sm">
                  <option>Hormonal Profile</option>
                  <option>Semen Analysis</option>
                  <option>Genetic Screening</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Lab Name
                </label>
                <input
                  className="w-full rounded-lg bg-slate-100 p-3 text-sm"
                  defaultValue="City Fertility Lab"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Date of Sample
                </label>
                <input className="w-full rounded-lg bg-slate-100 p-3 text-sm" type="date" />
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <p className="font-semibold text-emerald-700">
                  Uploading: hormonal_sept_24.pdf
                </p>
                <p className="font-bold">78%</p>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" />
              </div>
            </div>
          </article>

          <article className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="flex items-center justify-between bg-slate-100 px-6 py-4">
              <h2 className="font-bold">AI Parsing Preview</h2>
              <StatusBadge label="Extracting" tone="warning" />
            </div>
            <div className="p-6">
              <table className="w-full min-w-[520px] text-left">
                <thead>
                  <tr className="border-b text-sm text-slate-500">
                    <th className="pb-3">Marker</th>
                    <th className="pb-3">Result</th>
                    <th className="pb-3">Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    ["Estradiol (E2)", "2450", "pg/mL"],
                    ["LH", "1.2", "mIU/mL"],
                    ["Progesterone", "0.8", "ng/mL"],
                  ].map((row) => (
                    <tr key={row[0]}>
                      <td className="py-3 font-semibold">{row[0]}</td>
                      <td className="py-3">
                        <input
                          defaultValue={row[1]}
                          className="w-20 rounded bg-slate-100 px-2 py-1"
                        />
                      </td>
                      <td className="py-3 text-slate-500">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost">Cancel</Button>
                <Button className="rounded-full bg-emerald-700 hover:bg-emerald-600">
                  Confirm & Submit
                </Button>
              </div>
            </div>
          </article>
        </div>

        <aside className="space-y-6 lg:col-span-5">
          <article className="rounded-2xl bg-emerald-100 p-6">
            <h3 className="mb-3 text-xl font-bold text-emerald-900">Upload Guidelines</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm text-emerald-900">
              <li>Ensure patient name and date of birth are visible.</li>
              <li>Upload high resolution scans with correct orientation.</li>
              <li>All uploads are encrypted and HIPAA compliant.</li>
            </ul>
          </article>

          <article className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-bold">Recent Submissions</h3>
            <div className="space-y-3">
              {uploadedReports.map((report) => (
                <div key={report.id} className="rounded-xl bg-slate-100 p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold">{report.name}</p>
                      <p className="text-xs text-slate-500">{report.date}</p>
                    </div>
                    <StatusBadge
                      label={report.status}
                      tone={report.status === "Reviewed" ? "success" : "warning"}
                    />
                  </div>
                  <p className="text-xs text-slate-500">{report.reviewer}</p>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}
