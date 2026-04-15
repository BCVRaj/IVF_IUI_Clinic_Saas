"use client";

import { useEffect, useState } from "react";
import { Filter } from "lucide-react";

import { StatusBadge } from "@/components/patient/status-badge";
import { Button } from "@/components/ui/button";

export default function PatientComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form state
  const [category, setCategory] = useState("Pain & Physical Discomfort");
  const [severity, setSeverity] = useState(1);
  const [description, setDescription] = useState("");

  const fetchComplaints = async () => {
    try {
      const res = await fetch("/api/patient/complaints");
      if (res.ok) {
        const json = await res.json();
        setComplaints(json.data || []);
      }
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComplaints(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setSubmitError("Please describe your symptom.");
      return;
    }
    try {
      setSubmitting(true);
      setSubmitError(null);
      const res = await fetch("/api/patient/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complaintText: description, severity, category }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to submit");
      setDescription("");
      setSeverity(1);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
      await fetchComplaints();
    } catch (err: any) {
      setSubmitError(err.message || "Error submitting complaint");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900">Symptom Journal</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Log your physical and emotional updates so the clinical team can tailor your care plan.
        </p>
      </header>

      <section className="rounded-2xl bg-white p-7 shadow-sm">
        <h2 className="mb-6 text-xl font-bold">Create New Entry</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 md:grid-cols-12">
          <div className="md:col-span-6">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Category</label>
            <select
              className="w-full rounded-lg bg-slate-100 p-3 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>Pain & Physical Discomfort</option>
              <option>Emotional & Mental Wellbeing</option>
              <option>Medication Side Effects</option>
              <option>Injection Site Reaction</option>
            </select>
          </div>

          <div className="md:col-span-6">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Severity</label>
            <div className="flex rounded-full bg-slate-100 p-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSeverity(level)}
                  className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${
                    severity === level ? "bg-emerald-700 text-white" : "text-slate-500 hover:bg-white"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-12">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg bg-slate-100 p-3 text-sm"
              placeholder="How are you feeling today? Mention timing, duration, and intensity..."
            />
          </div>

          {submitError && (
            <div className="md:col-span-12 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{submitError}</div>
          )}
          {submitSuccess && (
            <div className="md:col-span-12 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">Entry submitted successfully.</div>
          )}

          <div className="md:col-span-12 flex justify-end">
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-emerald-700 px-8 hover:bg-emerald-600"
            >
              {submitting ? "Submitting..." : "Submit Log"}
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

        {loading && <p className="text-sm text-slate-500">Loading history...</p>}

        {!loading && complaints.length === 0 && (
          <p className="text-sm text-slate-500">No entries yet. Submit your first log above.</p>
        )}

        <div className="space-y-4">
          {complaints.map((item: any) => (
            <article key={item.id} className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="text-xs font-bold text-slate-500">ID: {item.id?.slice(0, 8)}</p>
                <StatusBadge
                  label={item.status || "Open"}
                  tone={item.status === "OPEN" ? "danger" : "success"}
                />
                <p className="text-xs text-slate-500">
                  {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
                </p>
              </div>
              <p className="mt-1 text-base font-bold text-slate-900">{item.complaint_text}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge label={`Severity: ${item.severity || "NORMAL"}`} />
              </div>
              {(item.nurse_notes || item.doctor_notes) && (
                <div className="mt-4 rounded-lg bg-slate-100 p-4">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500">Clinic Response</p>
                  <p className="text-sm text-slate-700">{item.nurse_notes || item.doctor_notes}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
