"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { FlaskConical, Microscope, ShieldCheck, TestTube2, GripVertical } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { labBoardColumns } from "@/lib/mock-doctor-data";

// ─── Types ────────────────────────────────────────────────────────────────────

type ColumnId = "received" | "processing" | "ready" | "reviewed";

type CardItem = {
  id: string;
  testType: string;
  sampleDate: string;
  urgency: "high" | "normal";
  meta: string;
  columnId: ColumnId;
};

type BoardState = Record<ColumnId, CardItem[]>;

// ─── Seed data (maps existing mock data → CardItem shape) ─────────────────────

function buildInitialBoard(): BoardState {
  const received: CardItem[] = labBoardColumns.received.map((item) => ({
    id: item.id,
    testType: item.title,
    sampleDate: item.date,
    urgency: item.priority === "STAT" ? "high" : "normal",
    meta: `Assigned: ${item.tech}`,
    columnId: "received",
  }));

  const processing: CardItem[] = labBoardColumns.processing.map((item) => ({
    id: item.id,
    testType: item.title,
    sampleDate: item.stage,
    urgency: item.progress >= 70 ? "high" : "normal",
    meta: `${item.incubator} • ${item.tech}`,
    columnId: "processing",
  }));

  const ready: CardItem[] = labBoardColumns.ready.map((item) => ({
    id: item.id,
    testType: item.title,
    sampleDate: `Ready ${item.readyAt}`,
    urgency: "normal",
    meta: `Validated by ${item.tech}`,
    columnId: "ready",
  }));

  const reviewed: CardItem[] = labBoardColumns.reviewed.map((item) => ({
    id: item.id,
    testType: item.title,
    sampleDate: "Report Signed Off",
    urgency: "normal",
    meta: item.signoff,
    columnId: "reviewed",
  }));

  return { received, processing, ready, reviewed };
}

// ─── Column metadata ──────────────────────────────────────────────────────────

const COLUMNS: {
  id: ColumnId;
  title: string;
  icon: ReactNode;
  tone: "slate" | "blue" | "emerald" | "violet";
}[] = [
  { id: "received",   title: "Sample Received", icon: <TestTube2 className="size-4" />,  tone: "slate"   },
  { id: "processing", title: "Processing",       icon: <Microscope className="size-4" />, tone: "blue"    },
  { id: "ready",      title: "Results Ready",    icon: <FlaskConical className="size-4" />, tone: "emerald" },
  { id: "reviewed",   title: "Reviewed",         icon: <ShieldCheck className="size-4" />, tone: "violet"  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

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

/** A single draggable card */
function SortableCard({ card, isDragging }: { card: CardItem; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: card.id,
    data: { columnId: card.columnId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative touch-none cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      {/* drag indicator */}
      <div className="absolute right-2 top-2 rounded p-0.5 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100">
        <GripVertical className="size-4" />
      </div>

      <div className="mb-2 flex items-start justify-between gap-2 pr-5">
        <p className="text-xs font-extrabold tracking-wide text-slate-900">{card.id}</p>
        <UrgencyBadge urgency={card.urgency} />
      </div>
      <p className="text-sm font-semibold text-slate-900">{card.testType}</p>
      <p className="mt-2 text-xs text-slate-600">Sample: {card.sampleDate}</p>
      <p className="mt-1 text-[11px] text-slate-500">{card.meta}</p>
    </article>
  );
}

/** Ghost card shown under the cursor while dragging */
function DragGhostCard({ card }: { card: CardItem }) {
  return (
    <article className="w-64 rotate-2 rounded-lg border border-blue-400 bg-white p-3 shadow-2xl ring-2 ring-blue-300">
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-xs font-extrabold tracking-wide text-slate-900">{card.id}</p>
        <UrgencyBadge urgency={card.urgency} />
      </div>
      <p className="text-sm font-semibold text-slate-900">{card.testType}</p>
      <p className="mt-2 text-xs text-slate-600">Sample: {card.sampleDate}</p>
      <p className="mt-1 text-[11px] text-slate-500">{card.meta}</p>
    </article>
  );
}

/** A Kanban column — acts as a drop zone */
function KanbanColumn({
  columnId,
  title,
  icon,
  cards,
  tone,
  isOver,
}: {
  columnId: ColumnId;
  title: string;
  icon: ReactNode;
  cards: CardItem[];
  tone: "slate" | "blue" | "emerald" | "violet";
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({
    id: columnId,
  });

  const toneStyles: Record<typeof tone, { bg: string; border: string; header: string; badge: string }> = {
    slate:   { bg: "bg-slate-50",   border: "border-slate-200",  header: "text-slate-900",  badge: "bg-slate-100 text-slate-700"  },
    blue:    { bg: "bg-blue-50",    border: "border-sky-200",    header: "text-blue-900",   badge: "bg-blue-100 text-blue-700"    },
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200",header: "text-emerald-900",badge: "bg-emerald-100 text-emerald-700"},
    violet:  { bg: "bg-violet-50",  border: "border-violet-200", header: "text-violet-900", badge: "bg-violet-100 text-violet-700" },
  };

  const ts = toneStyles[tone];

  return (
    <section
      ref={setNodeRef}
      id={`col-${columnId}`}
      className={`min-h-[75vh] rounded-xl border-2 p-4 transition-colors duration-150 ${ts.bg} ${
        isOver ? "border-blue-400 bg-blue-50/60 ring-2 ring-blue-300/50" : ts.border
      }`}
    >
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={ts.header}>{icon}</span>
          <h3 className={`text-sm font-bold uppercase tracking-wider ${ts.header}`}>{title}</h3>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ring-1 ring-white/60 ${ts.badge}`}>
          {cards.length}
        </span>
      </header>

      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {cards.map((card) => (
            <SortableCard key={card.id} card={card} />
          ))}
          {/* empty-state drop target */}
          {cards.length === 0 && (
            <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-xs text-slate-400">
              Drop here
            </div>
          )}
        </div>
      </SortableContext>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

// ─── Pending-move type (used for confirmation dialog) ─────────────────────────
type PendingMove = {
  card: CardItem;
  sourceColId: ColumnId;
  destColId: ColumnId;
  overId: string; // card-id or column-id we dropped onto
};

// ─── Confirmation Modal ───────────────────────────────────────────────────────
function ConfirmMoveModal({
  pending,
  onConfirm,
  onCancel,
}: {
  pending: PendingMove;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const srcLabel = COLUMNS.find((c) => c.id === pending.sourceColId)?.title ?? pending.sourceColId;
  const dstLabel = COLUMNS.find((c) => c.id === pending.destColId)?.title ?? pending.destColId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Dialog */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-extrabold text-[#1A237E]">Move Card?</h2>
          <button
            onClick={onCancel}
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Card</p>
            <p className="text-sm font-extrabold text-slate-900">{pending.card.id}</p>
            <p className="text-sm text-slate-700 mt-0.5">{pending.card.testType}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">From</p>
              <p className="mt-0.5 text-xs font-bold text-slate-700">{srcLabel}</p>
            </div>
            <span className="text-slate-400 text-lg">→</span>
            <div className="flex-1 rounded-lg border border-[#1A237E]/30 bg-blue-50 px-3 py-2 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#1A237E]/60">To</p>
              <p className="mt-0.5 text-xs font-bold text-[#1A237E]">{dstLabel}</p>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Are you sure you want to move this card to <span className="font-semibold text-slate-700">{dstLabel}</span>?
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-slate-200 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 transition-colors hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-[#1A237E] py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#111a63]"
          >
            Confirm Move
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DoctorLabBoardPage() {
  const [board, setBoard] = useState<BoardState>(buildInitialBoard);
  const [activeCard, setActiveCard] = useState<CardItem | null>(null);
  const [overColumnId, setOverColumnId] = useState<ColumnId | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  /** Find which column a card currently lives in */
  function findColumn(cardId: string): ColumnId | null {
    for (const col of Object.keys(board) as ColumnId[]) {
      if (board[col].some((c) => c.id === cardId)) return col;
    }
    return null;
  }

  function handleDragStart({ active }: DragStartEvent) {
    const colId = findColumn(active.id as string);
    if (!colId) return;
    const card = board[colId].find((c) => c.id === active.id) ?? null;
    setActiveCard(card);
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) { setOverColumnId(null); return; }
    const overId = over.id as string;
    const isColumn = (COLUMNS.map((c) => c.id) as string[]).includes(overId);
    const targetCol: ColumnId | null = isColumn
      ? (overId as ColumnId)
      : findColumn(overId);
    setOverColumnId(targetCol);
  }

  /** Apply a cross-column move to board state */
  function applyMove(move: PendingMove) {
    setBoard((prev) => {
      const sourceCards = [...prev[move.sourceColId]];
      const cardIndex = sourceCards.findIndex((c) => c.id === move.card.id);
      if (cardIndex === -1) return prev;

      const [movedCard] = sourceCards.splice(cardIndex, 1);
      const updatedCard = { ...movedCard, columnId: move.destColId };

      const destCards = [...prev[move.destColId]];
      const overIndex = destCards.findIndex((c) => c.id === move.overId);
      if (overIndex >= 0) {
        destCards.splice(overIndex, 0, updatedCard);
      } else {
        destCards.push(updatedCard);
      }

      return {
        ...prev,
        [move.sourceColId]: sourceCards,
        [move.destColId]: destCards,
      };
    });
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveCard(null);
    setOverColumnId(null);
    if (!over) return;

    const cardId = active.id as string;
    const overId = over.id as string;

    const sourceColId = findColumn(cardId);
    if (!sourceColId) return;

    const isColumn = (COLUMNS.map((c) => c.id) as string[]).includes(overId);
    const destColId: ColumnId | null = isColumn ? (overId as ColumnId) : findColumn(overId);
    if (!destColId) return;

    if (sourceColId === destColId) {
      // Same-column reorder — apply immediately, no confirmation needed
      setBoard((prev) => {
        const sourceCards = [...prev[sourceColId]];
        const cardIndex = sourceCards.findIndex((c) => c.id === cardId);
        if (cardIndex === -1) return prev;
        const [movedCard] = sourceCards.splice(cardIndex, 1);
        const overIndex = sourceCards.findIndex((c) => c.id === overId);
        const insertAt = overIndex >= 0 ? overIndex : sourceCards.length;
        sourceCards.splice(insertAt, 0, movedCard);
        return { ...prev, [sourceColId]: sourceCards };
      });
      return;
    }

    // Cross-column move — show confirmation dialog
    const card = board[sourceColId].find((c) => c.id === cardId);
    if (!card) return;
    setPendingMove({ card, sourceColId, destColId, overId });
  }

  function confirmMove() {
    if (!pendingMove) return;
    applyMove(pendingMove);
    setPendingMove(null);
  }

  function cancelMove() {
    setPendingMove(null);
  }

  return (
    <div className="space-y-6 bg-slate-50 text-slate-900">
      <header className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Lab Board</h2>
          <p className="text-sm text-slate-600">
            Embryology workflow · drag cards between columns to update status
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 shadow-sm">
          <GripVertical className="size-3.5" />
          Drag cards to move
        </div>
      </header>

      <DndContext
        id="lab-board-dnd"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              columnId={col.id}
              title={col.title}
              icon={col.icon}
              cards={board[col.id]}
              tone={col.tone}
              isOver={overColumnId === col.id}
            />
          ))}
        </div>

        {/* Floating ghost that follows the cursor */}
        <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
          {activeCard ? <DragGhostCard card={activeCard} /> : null}
        </DragOverlay>
      </DndContext>

      {/* Confirmation dialog — shown when a cross-column drag is pending */}
      {pendingMove && (
        <ConfirmMoveModal
          pending={pendingMove}
          onConfirm={confirmMove}
          onCancel={cancelMove}
        />
      )}
    </div>
  );
}
