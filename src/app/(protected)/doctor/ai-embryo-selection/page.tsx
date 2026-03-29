import { Brain, GitCompareArrows } from "lucide-react";

import { aiEmbryos, aiReasoning } from "@/lib/mock-doctor-data";

export default function DoctorAIEmbryoSelectionPage() {
  return (
    <div className="grid grid-cols-12 gap-6 bg-slate-950 text-slate-50">
      <main className="col-span-12 space-y-6 lg:col-span-8">
        <header className="flex items-end justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#93CDFC]">Live Analysis Mode</p>
            <h2 className="text-4xl font-extrabold tracking-tight text-slate-50">Batch #882-Delta</h2>
            <p className="mt-1 text-sm text-slate-300">Patient: E. Sterling (ID: 99402) • Day 5 Blastocyst Assessment</p>
          </div>
          <div className="rounded border border-slate-800 bg-slate-900 px-4 py-2 text-right">
            <p className="text-[10px] uppercase tracking-widest text-slate-300">Confidence Index</p>
            <p className="text-xl font-black text-[#93CDFC]">98.4%</p>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2 2xl:grid-cols-3">
          {aiEmbryos.map((embryo) => (
            <article
              key={embryo.id}
              className={`overflow-hidden rounded-lg border ${
                embryo.recommended
                  ? "border-[#93CDFC]/50 shadow-[0_0_16px_rgba(147,205,252,0.25)]"
                  : "border-slate-800"
              } bg-slate-900`}
            >
              <div className="relative aspect-square border-b border-slate-800 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-4">
                {embryo.recommended ? (
                  <span className="absolute left-4 top-4 rounded bg-[#93CDFC] px-2 py-1 text-[10px] font-black uppercase tracking-tight text-[#00344f]">
                    Recommended for Transfer
                  </span>
                ) : null}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                  <div className="rounded border border-slate-700 bg-slate-900/85 px-3 py-2 backdrop-blur">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#93CDFC]">AI Score</p>
                    <p className="text-3xl font-black leading-none text-slate-50">
                      {embryo.score}
                      <span className="text-xs text-slate-300">/100</span>
                    </p>
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="rounded border border-slate-700 bg-slate-900/85 px-3 py-1 text-xs font-bold text-slate-50 backdrop-blur">
                      Grade: {embryo.grade}
                    </div>
                    <div className="rounded border border-slate-700 bg-slate-900/85 px-3 py-1 text-[10px] text-slate-300 backdrop-blur">
                      Frag: {embryo.fragmentation}%
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between bg-slate-900 p-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-50">Embryo ID: {embryo.id}</span>
                <button className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#93CDFC] hover:underline">
                  <GitCompareArrows className="size-3.5" /> Add to Compare
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>

      <aside className="col-span-12 flex h-full flex-col rounded border border-slate-800 bg-slate-900 lg:col-span-4">
        <div className="border-b border-slate-800 p-6">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-50">AI Analysis Reasoning</h3>
          <div className="rounded border border-slate-800 border-l-2 border-l-[#93CDFC] bg-slate-900 p-4">
            <p className="text-xs italic leading-relaxed text-slate-200">“{aiReasoning}”</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded border border-slate-800 bg-slate-900 p-2 text-center">
              <p className="text-[9px] uppercase tracking-widest text-slate-300">ICM Quality</p>
              <p className="text-xs font-bold text-[#93CDFC]">Optimal</p>
            </div>
            <div className="rounded border border-slate-800 bg-slate-900 p-2 text-center">
              <p className="text-[9px] uppercase tracking-widest text-slate-300">Expansion</p>
              <p className="text-xs font-bold text-[#93CDFC]">Full (4)</p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-5 p-6">
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-50">Visual Comparison</h3>
            <div className="grid grid-cols-2 gap-2">
              {aiEmbryos.slice(0, 2).map((embryo) => (
                <div key={embryo.id} className="relative aspect-square overflow-hidden rounded border border-slate-800 bg-slate-900">
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-50">
                    {embryo.id}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-slate-50">Clinical Override</h3>
            <textarea
              className="min-h-[110px] w-full rounded border border-slate-800 bg-slate-900 p-3 text-xs text-slate-200 placeholder:text-slate-400"
              placeholder="Enter manual grading adjustments or clinical observations..."
            />
            <label className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-300">
              <input type="checkbox" className="rounded border-slate-700 bg-slate-900" />
              Verify AI assessment for transfer
            </label>
          </div>
        </div>

        <div className="border-t border-slate-800 p-6">
          <button className="w-full rounded bg-gradient-to-r from-white to-[#93CDFC] py-4 text-xs font-black uppercase tracking-[0.2em] text-[#111318] shadow-[0_0_16px_rgba(147,205,252,0.2)]">
            Finalize Selection
          </button>
          <button className="mt-3 w-full py-2 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-slate-50">
            Save for Peer Review
          </button>
          <div className="mt-4 flex items-center gap-2 rounded border border-slate-800 bg-slate-900 p-3 text-[11px] text-[#93CDFC]">
            <Brain className="size-4" /> AI model calibrated with 12,480 historical embryo outcomes.
          </div>
        </div>
      </aside>
    </div>
  );
}
