import { Brain, GitCompareArrows } from "lucide-react";

import { aiEmbryos, aiReasoning } from "@/lib/mock-doctor-data";

export default function DoctorAIEmbryoSelectionPage() {
  return (
    <div className="grid grid-cols-12 gap-6 bg-background text-on-surface">
      <main className="col-span-12 space-y-6 lg:col-span-8">
        <header className="flex items-end justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Live Analysis Mode</p>
            <h2 className="text-4xl font-extrabold tracking-tight text-on-surface">Batch #882-Delta</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Patient: E. Sterling (ID: 99402) • Day 5 Blastocyst Assessment</p>
          </div>
          <div className="rounded border border-surface-dim/30 bg-surface-lowest px-4 py-2 text-right shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Confidence Index</p>
            <p className="text-xl font-black text-primary">98.4%</p>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2 2xl:grid-cols-3">
          {aiEmbryos.map((embryo) => (
            <article
              key={embryo.id}
              className={`overflow-hidden rounded-lg border ${
                embryo.recommended
                  ? "border-primary/50 shadow-[0_0_16px_rgba(63,81,181,0.25)]"
                  : "border-surface-dim/30"
              } bg-surface-lowest shadow-sm`}
            >
              <div className="relative aspect-square border-b border-surface-low bg-gradient-to-br from-surface via-surface-lowest to-background p-4">
                {embryo.recommended ? (
                  <span className="absolute left-4 top-4 rounded bg-primary px-2 py-1 text-[10px] font-black uppercase tracking-tight text-primary-foreground">
                    Recommended for Transfer
                  </span>
                ) : null}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div className="rounded border border-surface-dim/30 bg-surface-lowest/85 px-3 py-2 backdrop-blur">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">AI Score</p>
                    <p className="text-3xl font-black leading-none text-on-surface">
                      {embryo.score}
                      <span className="text-xs text-on-surface-variant">/100</span>
                    </p>
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="rounded border border-surface-dim/30 bg-surface-lowest/85 px-3 py-1 text-xs font-bold text-on-surface backdrop-blur">
                      Grade: {embryo.grade}
                    </div>
                    <div className="rounded border border-surface-dim/30 bg-surface-lowest/85 px-3 py-1 text-[10px] text-on-surface-variant backdrop-blur">
                      Frag: {embryo.fragmentation}%
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between bg-surface p-4">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface">Embryo ID: {embryo.id}</span>
                <button className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
                  <GitCompareArrows className="size-3.5" /> Add to Compare
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>

      <aside className="col-span-12 flex h-full flex-col rounded border border-surface-dim/30 bg-surface-lowest lg:col-span-4 shadow-[0_8px_32px_rgba(25,28,30,0.04)] backdrop-blur-md">
        <div className="border-b border-surface-low p-6">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-on-surface">AI Analysis Reasoning</h3>
          <div className="rounded border border-surface-dim/30 border-l-2 border-l-primary bg-surface p-4">
            <p className="text-xs italic leading-relaxed text-on-surface-variant">"{aiReasoning}"</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded border border-surface-dim/30 bg-surface p-2 text-center shadow-sm">
              <p className="text-[9px] uppercase tracking-widest text-on-surface-variant">ICM Quality</p>
              <p className="text-xs font-bold text-primary">Optimal</p>
            </div>
            <div className="rounded border border-surface-dim/30 bg-surface p-2 text-center shadow-sm">
              <p className="text-[9px] uppercase tracking-widest text-on-surface-variant">Expansion</p>
              <p className="text-xs font-bold text-primary">Full (4)</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-5 p-6">
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-on-surface">Visual Comparison</h3>
            <div className="grid grid-cols-2 gap-2">
              {aiEmbryos.slice(0, 2).map((embryo) => (
                <div key={embryo.id} className="relative aspect-square overflow-hidden rounded border border-surface-dim/30 bg-surface shadow-sm">
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-on-surface">
                    {embryo.id}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-on-surface">Clinical Override</h3>
            <textarea
              className="min-h-[110px] w-full rounded border border-surface-dim/30 bg-surface p-3 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter manual grading adjustments or clinical observations..."
            />
            <label className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-on-surface-variant">
              <input type="checkbox" className="rounded border-surface-dim bg-surface" />
              Verify AI assessment for transfer
            </label>
          </div>
        </div>

        <div className="border-t border-surface-low p-6">
          <button className="w-full rounded bg-gradient-to-r from-primary to-primary-container py-4 text-xs font-black uppercase tracking-[0.2em] text-primary-foreground hover:opacity-90 shadow-sm">
            Finalize Selection
          </button>
          <button className="mt-3 w-full py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface">
            Save for Peer Review
          </button>
          <div className="mt-4 flex items-center gap-2 rounded border border-primary/20 bg-primary/10 p-3 text-[11px] text-primary">
            <Brain className="size-4" /> AI model calibrated with 12,480 historical embryo outcomes.
          </div>
        </div>
      </aside>
    </div>
  );
}
