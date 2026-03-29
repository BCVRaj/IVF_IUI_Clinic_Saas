import { Pill, Syringe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MedicationCardProps = {
  name: string;
  dose: string;
  route: string;
  time: string;
  status: "taken" | "upcoming";
  note?: string;
};

export function MedicationCard({
  name,
  dose,
  route,
  time,
  status,
  note,
}: MedicationCardProps) {
  return (
    <article
      className={cn(
        "rounded-xl border-l-4 bg-white p-5 shadow-sm",
        status === "taken" ? "border-emerald-500" : "border-rose-300"
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="rounded-full bg-emerald-50 p-3 text-emerald-700">
          {route.toLowerCase().includes("injection") ? (
            <Syringe className="size-5" />
          ) : (
            <Pill className="size-5" />
          )}
        </div>
        <span
          className={cn(
            "rounded-md px-2 py-1 text-[10px] font-bold",
            status === "taken"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-rose-100 text-rose-700"
          )}
        >
          {time}
        </span>
      </div>
      <h4 className="font-bold text-slate-900">{name}</h4>
      <p className="text-sm text-slate-600">{dose}</p>
      <p className="mb-4 text-sm text-slate-500">{route}</p>

      {status === "taken" ? (
        <p className="text-xs font-semibold text-emerald-700">{note ?? "Taken"}</p>
      ) : (
        <Button variant="secondary" className="w-full rounded-full">
          Mark as Taken
        </Button>
      )}
    </article>
  );
}
