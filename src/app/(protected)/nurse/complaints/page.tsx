import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ComplaintsConsole } from "@/components/nurse/complaints-console";

export default function NurseComplaintsPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#000666]">
            Complaint Registry
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Patient satisfaction and incident management console.
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="rounded-lg bg-slate-100 py-2 pl-9 pr-3 text-sm"
              placeholder="Search Patient ID..."
            />
          </div>
          <Button variant="secondary" className="rounded-lg">
            Filter
          </Button>
        </div>
      </header>

      <ComplaintsConsole />
    </div>
  );
}
