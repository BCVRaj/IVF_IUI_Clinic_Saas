import { Filter, Upload } from "lucide-react";

import { StatusBadge } from "@/components/patient/status-badge";
import { Button } from "@/components/ui/button";
import { complaints } from "@/lib/mock-patient-data";

export default function PatientComplaintsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900">Symptom Journal</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Log your physical and emotional updates so the clinical team can tailor
          your care plan.
        </p>
      </header>

      <section className="rounded-2xl bg-white p-7 shadow-sm">
        <h2 className="mb-6 text-xl font-bold">Create New Entry</h2>
        <form className="grid grid-cols-1 gap-5 md:grid-cols-12">
          <div className="md:col-span-6">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Category
            </label>
            <select className="w-full rounded-lg bg-slate-100 p-3 text-sm">
              <option>Pain & Physical Discomfort</option>
              <option>Emotional & Mental Wellbeing</option>
              <option>Medication Side Effects</option>
              <option>Injection Site Reaction</option>
            </select>
          </div>

          <div className="md:col-span-6">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Severity
            </label>
            <div className="flex rounded-full bg-slate-100 p-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`flex-1 rounded-full py-2 text-sm font-bold ${
                    level === 1
                      ? "bg-emerald-700 text-white"
                      : "text-slate-500 hover:bg-white"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-12">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Description
            </label>
            <textarea
              rows={4}
              className="w-full rounded-lg bg-slate-100 p-3 text-sm"
              placeholder="How are you feeling today? Mention timing, duration, and intensity..."
            />
          </div>

          <div className="md:col-span-12">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Attachments
            </label>
            <div className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <Upload className="mb-2 size-6 text-slate-500" />
              <p className="text-sm font-medium text-slate-700">Click to upload photo or document</p>
              <p className="text-xs text-slate-500">JPG, PNG, PDF · Max 10MB</p>
            </div>
          </div>

          <div className="md:col-span-12 flex justify-end">
            <Button className="rounded-full bg-emerald-700 px-8 hover:bg-emerald-600">
              Submit Log
            </Button>
          </div>
        </form>
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Recent History</h2>
          <Button variant="secondary" className="rounded-full">
            <Filter className="size-4" />
            Filters
          </Button>
        </div>

        <div className="space-y-4">
          {complaints.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="text-xs font-bold text-slate-500">ID: {item.id}</p>
                <StatusBadge
                  label={item.status}
                  tone={item.status === "Open" ? "danger" : "success"}
                />
                <p className="text-xs text-slate-500">{item.datetime}</p>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge label={`Intensity ${item.severity}`} />
                <StatusBadge label={item.category} />
              </div>

              <div className="mt-4 rounded-lg bg-slate-100 p-4">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Clinic Response
                </p>
                <p className="text-sm text-slate-700">{item.response}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
