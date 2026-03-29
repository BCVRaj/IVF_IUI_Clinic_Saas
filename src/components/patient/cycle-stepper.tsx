import { CheckCircle2, CircleDotDashed } from "lucide-react";

import { cn } from "@/lib/utils";

type Step = {
  label: string;
  status: "done" | "active" | "upcoming";
};

export function CycleStepper({ steps }: { steps: readonly Step[] }) {
  return (
    <section>
      <h3 className="mb-4 text-xl font-extrabold text-slate-800">Cycle Progress</h3>
      <div className="flex flex-wrap gap-3 rounded-2xl bg-slate-100 p-3">
        {steps.map((step) => (
          <div
            key={step.label}
            className={cn(
              "min-w-[130px] flex-1 rounded-xl border px-3 py-4 text-center",
              step.status === "active" &&
                "border-emerald-500 bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow",
              step.status === "done" && "border-emerald-200 bg-emerald-50 text-emerald-800",
              step.status === "upcoming" && "border-slate-200 bg-white text-slate-500"
            )}
          >
            <div className="mb-2 flex justify-center">
              {step.status === "done" ? (
                <CheckCircle2 className="size-5" />
              ) : (
                <CircleDotDashed className="size-5" />
              )}
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider">{step.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
