import type { ReactNode } from "react";
import { FlaskConical, Microscope, ShieldCheck, TestTube2 } from "lucide-react";

import { labBoardColumns } from "@/lib/mock-doctor-data";

type CardItem = {
  id: string;
  testType: string;
  sampleDate: string;
  urgency: "high" | "normal";
  meta: string;
};

const receivedCards: CardItem[] = labBoardColumns.received.map((item) => ({
  id: item.id,
  testType: item.title,
  sampleDate: item.date,
  urgency: item.priority === "STAT" ? "high" : "normal",
  meta: `Assigned: ${item.tech}`,
}));

const processingCards: CardItem[] = labBoardColumns.processing.map((item) => ({
  id: item.id,
  testType: item.title,
  sampleDate: item.stage,
  urgency: item.progress >= 70 ? "high" : "normal",
  meta: `${item.incubator} • ${item.tech}`,
}));

const readyCards: CardItem[] = labBoardColumns.ready.map((item) => ({
  id: item.id,
  testType: item.title,
  sampleDate: `Ready ${item.readyAt}`,
  urgency: "normal",
  meta: `Validated by ${item.tech}`,
}));

const reviewedCards: CardItem[] = labBoardColumns.reviewed.map((item) => ({
  id: item.id,
  testType: item.title,
  sampleDate: "Report Signed Off",
  urgency: "normal",
  meta: item.signoff,
}));

function UrgencyBadge({ urgency }: { urgency: CardItem["urgency"] }) {
  return urgency === "high" ? (
    <span className="rounded-full bg-rose-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-700">
      High
    </span>
  ) : (
    <span className="rounded-full bg-teal-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-700">
      Normal
    </span>
  );
}

function KanbanColumn({
  title,
  count,
  icon,
  cards,
  containerTone,
}: {
  title: string;
  count: number;
  icon: ReactNode;
  cards: CardItem[];
  containerTone: "slate" | "blue";
}) {
  return (
    <section
      className={`min-h-[75vh] rounded-lg border p-4 ${
        containerTone === "blue"
          ? "border-sky-200 bg-blue-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-slate-600">{icon}</span>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">{title}</h3>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">
          {count}
        </span>
      </header>

      <div className="space-y-3">
        {cards.map((card) => (
          <article
            key={card.id}
            className="rounded-md border border-slate-200 bg-white p-3 shadow-sm"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <p className="text-xs font-extrabold tracking-wide text-slate-900">{card.id}</p>
              <UrgencyBadge urgency={card.urgency} />
            </div>
            <p className="text-sm font-semibold text-slate-900">{card.testType}</p>
            <p className="mt-2 text-xs text-slate-600">Sample: {card.sampleDate}</p>
            <p className="mt-1 text-[11px] text-slate-500">{card.meta}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function DoctorLabBoardPage() {
  return (
    <div className="space-y-6 bg-slate-50 text-slate-900">
      <header className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Lab Board</h2>
          <p className="text-sm text-slate-600">Embryology workflow in strict Kanban operations mode</p>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-4">
        <KanbanColumn
          title="Sample Received"
          count={receivedCards.length}
          icon={<TestTube2 className="size-4" />}
          cards={receivedCards}
          containerTone="slate"
        />
        <KanbanColumn
          title="Processing"
          count={processingCards.length}
          icon={<Microscope className="size-4" />}
          cards={processingCards}
          containerTone="blue"
        />
        <KanbanColumn
          title="Results Ready"
          count={readyCards.length}
          icon={<FlaskConical className="size-4" />}
          cards={readyCards}
          containerTone="slate"
        />
        <KanbanColumn
          title="Reviewed"
          count={reviewedCards.length}
          icon={<ShieldCheck className="size-4" />}
          cards={reviewedCards}
          containerTone="blue"
        />
      </div>
    </div>
  );
}
