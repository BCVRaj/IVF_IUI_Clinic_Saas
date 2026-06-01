'use client'

import { useState, useRef } from 'react'
import { Brain, GitCompareArrows, Upload, X, AlertCircle, Loader2 } from 'lucide-react'

// ── Types matching embryo-ai-backend API response ──────────────────────────
interface EmbryoResult {
  blastocystScore: number
  expansionScore: number
  icmScore: number
  trophectodermScore: number
  euploidProbablity: number
  euploidPrediction: boolean
  framesUsed?: number
  framesTotal?: number
}

interface TopFrame {
  rank: number
  image: string          // base64 data URL
  euploidProbability: number
  grade: string
}

interface StorkPrediction {
  lrEupAnu: EmbryoResult
  lrEupCxa: EmbryoResult
  topFrames?: TopFrame[]
}

// ── Map embryo scores to display values ────────────────────────────────────
function toAIScore(prob: number) {
  return Math.round(prob * 100)
}

function toGrade(expansionScore: number, icm: number, te: number): string {
  const stage    = Math.min(6, Math.max(1, Math.round(expansionScore)))
  const icmGrade = icm >= 0.7 ? 'A' : icm >= 0.5 ? 'B' : 'C'
  const teGrade  = te  >= 0.7 ? 'A' : te  >= 0.5 ? 'B' : 'C'
  return `${stage}${icmGrade}${teGrade}`
}

function icmLabel(score: number) {
  return score >= 0.7 ? 'Optimal' : score >= 0.5 ? 'Good' : 'Fair'
}

function expansionLabel(score: number) {
  if (score >= 0.85) return 'Full (6)'
  if (score >= 0.7)  return 'Expanded (5)'
  if (score >= 0.55) return 'Blastocyst (4)'
  return 'Early (3)'
}

function reasoningFromResult(anu: EmbryoResult, cxa: EmbryoResult): string {
  const dominant = anu.euploidProbablity >= cxa.euploidProbablity ? anu : cxa
  const modelName = anu.euploidProbablity >= cxa.euploidProbablity ? 'EUP/ANU' : 'EUP/CxA'
  const pct = Math.round(dominant.euploidProbablity * 100)
  const icmQ = icmLabel(dominant.icmScore)
  const expQ = expansionLabel(dominant.expansionScore)
  return `${modelName} model assigns ${pct}% euploid probability. ` +
    `ICM quality is ${icmQ.toLowerCase()} (${(dominant.icmScore * 100).toFixed(0)}%), ` +
    `blastocyst expansion is ${expQ.toLowerCase()}, ` +
    `trophectoderm score ${(dominant.trophectodermScore * 100).toFixed(0)}%. ` +
    `Blastocyst score ${dominant.blastocystScore.toFixed(2)} on the Gardner scale.`
}

// ── Embryo result card ──────────────────────────────────────────────────────
function EmbryoCard({
  label,
  result,
  wellId,
  previewUrls,
  topFrames,
}: {
  label: string
  result: EmbryoResult
  wellId: string
  previewUrls: string[]
  topFrames?: TopFrame[]
}) {
  const aiScore = toAIScore(result.euploidProbablity)
  const grade = toGrade(result.expansionScore, result.icmScore, result.trophectodermScore)
  // Prefer backend base64 frames (works for video uploads); fall back to blob URLs for plain images
  const displayImages = (topFrames && topFrames.length > 0) ? topFrames.map(f => f.image) : previewUrls
  // Hero = the frame the model ranked #1 (highest euploid probability)
  const bestFrame = topFrames?.find(f => f.rank === 1)
  const heroUrl = bestFrame?.image ?? displayImages[Math.floor(displayImages.length / 2)] ?? null

  return (
    <article
      className={`overflow-hidden rounded-lg border ${
        result.euploidPrediction
          ? 'border-primary/50 shadow-[0_0_16px_rgba(63,81,181,0.25)]'
          : 'border-surface-dim/30'
      } bg-surface-lowest shadow-sm`}
    >
      <div className="relative aspect-square border-b border-surface-low bg-gradient-to-br from-surface via-surface-lowest to-background p-4">
        {result.euploidPrediction && (
          <span className="absolute left-4 top-4 z-10 rounded bg-primary px-2 py-1 text-[10px] font-black uppercase tracking-tight text-primary-foreground">
            Euploid Predicted
          </span>
        )}
        <span className="absolute right-4 top-4 z-10 rounded border border-surface-dim/30 bg-surface-lowest/85 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-on-surface-variant backdrop-blur">
          {label}
        </span>

        {/* Hero embryo image or fallback */}
        {heroUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroUrl}
            alt={`Embryo frame — ${label}`}
            className="absolute inset-0 h-full w-full object-cover opacity-80"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div className="size-24 rounded-full border-4 border-on-surface" />
          </div>
        )}

        {/* Film-strip thumbnails */}
        {displayImages.length > 0 && (
          <div className="absolute bottom-16 left-4 right-4 z-10 flex gap-1 overflow-x-auto">
            {displayImages.map((url, i) => {
              const isBest = topFrames ? topFrames[i]?.rank === 1 : false
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt={`frame ${i + 1}`}
                  className={`h-8 w-8 shrink-0 rounded object-cover opacity-80 ${
                    isBest ? 'border-2 border-primary' : 'border border-white/30'
                  }`}
                />
              )
            })}
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div className="rounded border border-surface-dim/30 bg-surface-lowest/85 px-3 py-2 backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">AI Score</p>
            <p className="text-3xl font-black leading-none text-on-surface">
              {aiScore}
              <span className="text-xs text-on-surface-variant">/100</span>
            </p>
          </div>
          <div className="space-y-2 text-right">
            <div className="rounded border border-surface-dim/30 bg-surface-lowest/85 px-3 py-1 text-xs font-bold text-on-surface backdrop-blur">
              Grade: {grade}
            </div>
            <div className="rounded border border-surface-dim/30 bg-surface-lowest/85 px-3 py-1 text-[10px] text-on-surface-variant backdrop-blur">
              BS: {result.blastocystScore.toFixed(2)}
            </div>
          </div>
        </div>
      </div>


      <div className="flex items-center justify-between bg-surface p-4">
        <span className="text-xs font-bold uppercase tracking-widest text-on-surface">
          Well: {wellId}
        </span>
        <div className="flex items-center gap-3">
          {result.framesUsed != null && result.framesTotal != null && (
            <span className="text-[9px] uppercase tracking-widest text-on-surface-variant">
              {result.framesUsed}/{result.framesTotal} frames
            </span>
          )}
          <button className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary hover:underline">
            <GitCompareArrows className="size-3.5" /> Add to Compare
          </button>
        </div>
      </div>
    </article>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function DoctorAIEmbryoSelectionPage() {
  const [maternalAge, setMaternalAge]     = useState<string>('32')
  const [files, setFiles]                 = useState<File[]>([])
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [prediction, setPrediction]       = useState<StorkPrediction | null>(null)
  const [previewUrls, setPreviewUrls]     = useState<string[]>([])
  const [clinicalNote, setClinicalNote]   = useState('')
  const [verified, setVerified]           = useState(false)
  const fileInputRef                      = useRef<HTMLInputElement>(null)

  const patientId    = 'E. Sterling (ID: 99402)'
  const batchLabel   = prediction ? 'Live Analysis' : 'Ready'

  function handleFiles(incoming: FileList | null) {
    if (!incoming) return
    const added = Array.from(incoming)
    setFiles(prev => [...prev, ...added])
    setPreviewUrls(prev => [...prev, ...added.map(f => URL.createObjectURL(f))])
    setError(null)
  }

  function removeFile(index: number) {
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  async function runAnalysis() {
    if (files.length < 1) {
      setError('At least 1 embryo image is required.')
      return
    }
    const age = parseFloat(maternalAge)
    if (isNaN(age) || age < 18 || age > 55) {
      setError('Please enter a valid maternal age (18–55).')
      return
    }

    setLoading(true)
    setError(null)
    setPrediction(null)

    try {
      const form = new FormData()
      form.append('data', JSON.stringify({ maternalAge: age }))
      files.forEach(f => form.append('images', f))

      const res = await fetch('/api/stork/predict', {
        method: 'POST',
        body: form,
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Analysis failed.')
        return
      }
      setPrediction(json as StorkPrediction)
    } catch {
      setError('Could not reach embryo-ai-backend. Is it running on port 8081?')
    } finally {
      setLoading(false)
    }
  }

  const dominantModel = prediction
    ? (prediction.lrEupAnu.euploidProbablity >= prediction.lrEupCxa.euploidProbablity
        ? prediction.lrEupAnu
        : prediction.lrEupCxa)
    : null

  return (
    <div className="grid grid-cols-12 gap-6 bg-background text-on-surface">

      {/* ── Main column ─────────────────────────────────────────────────── */}
      <main className="col-span-12 space-y-6 lg:col-span-8">

        {/* Header */}
        <header className="flex items-end justify-between">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              {batchLabel}
            </p>
            <h2 className="text-4xl font-extrabold tracking-tight text-on-surface">
              {prediction ? 'BELA Results' : 'AI Embryo Selection'}
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              Patient: {patientId} • Day 5 Blastocyst Assessment
            </p>
          </div>
          <div className="rounded border border-surface-dim/30 bg-surface-lowest px-4 py-2 text-right shadow-sm">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
              Confidence
            </p>
            <p className="text-xl font-black text-primary">
              {prediction
                ? `${Math.round(Math.max(prediction.lrEupAnu.euploidProbablity, prediction.lrEupCxa.euploidProbablity) * 100)}%`
                : '—'}
            </p>
          </div>
        </header>

        {/* Upload panel */}
        <section className="rounded-lg border border-surface-dim/30 bg-surface-lowest p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-on-surface">
            Upload Embryo Images
          </h3>

          <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Maternal Age
              </label>
              <input
                type="number"
                min={18}
                max={55}
                value={maternalAge}
                onChange={e => setMaternalAge(e.target.value)}
                className="w-full rounded border border-surface-dim/30 bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="col-span-2 flex items-end gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded border border-surface-dim/30 bg-surface px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface hover:bg-surface-low"
              >
                <Upload className="size-3.5" />
                Add Images
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.mp4,.mov,.avi,.mkv,.webm"
                multiple
                className="hidden"
                onChange={e => handleFiles(e.target.files)}
              />
              {files.length > 0 && (
                <span className="text-xs text-on-surface-variant">
                  {files.length} file{files.length !== 1 ? 's' : ''} selected
                  {files.length < 1 && (
                    <span className="ml-1 text-amber-500">(need {9 - files.length} more)</span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Filename hint */}
          <p className="mb-3 text-[10px] text-on-surface-variant">
            Upload blastocyst images (.jpg / .png) <strong>or a time-lapse video</strong> (.mp4, .mov, .avi). Videos are automatically split into frames — top-scoring frames are highlighted in the results.
          </p>

          {/* File list */}
          {files.length > 0 && (
            <div className="mb-4 max-h-36 overflow-y-auto rounded border border-surface-dim/20 bg-surface p-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between py-0.5 text-[11px] text-on-surface-variant">
                  <span className="font-mono truncate">{f.name}</span>
                  <button onClick={() => removeFile(i)} className="ml-2 shrink-0 hover:text-on-surface">
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={runAnalysis}
            disabled={loading || files.length < 1}
            className="flex items-center gap-2 rounded bg-gradient-to-r from-primary to-primary-container px-6 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-primary-foreground shadow-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="size-3.5 animate-spin" /> Analysing…</>
            ) : (
              <><Brain className="size-3.5" /> Run BELA Analysis</>
            )}
          </button>
        </section>

        {/* Results cards */}
        {prediction && (
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <EmbryoCard
              label="EUP / ANU Model"
              result={prediction.lrEupAnu}
              wellId="lrEupAnu"
              previewUrls={previewUrls}
              topFrames={prediction.topFrames}
            />
            <EmbryoCard
              label="EUP / CxA Model"
              result={prediction.lrEupCxa}
              wellId="lrEupCxa"
              previewUrls={previewUrls}
              topFrames={prediction.topFrames}
            />
          </section>
        )}

        {/* Top-scoring video frames */}
        {prediction?.topFrames && prediction.topFrames.length > 0 && (
          <section className="rounded-lg border border-surface-dim/30 bg-surface-lowest p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-bold uppercase tracking-widest text-on-surface">
              Top-Scoring Frames
            </h3>
            <p className="mb-4 text-[10px] text-on-surface-variant">
              Frames ranked by individual euploid probability — highest AI score first.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {prediction.topFrames.map(frame => (
                <div
                  key={frame.rank}
                  className={`relative overflow-hidden rounded-lg border ${
                    frame.rank === 1
                      ? 'border-primary shadow-[0_0_12px_rgba(63,81,181,0.3)]'
                      : 'border-surface-dim/30'
                  } bg-surface`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={frame.image}
                    alt={`Frame rank ${frame.rank}`}
                    className="aspect-square w-full object-cover"
                  />
                  {frame.rank === 1 && (
                    <span className="absolute left-1.5 top-1.5 rounded bg-primary px-1.5 py-0.5 text-[9px] font-black uppercase tracking-tight text-primary-foreground">
                      Best
                    </span>
                  )}
                  <div className="p-2">
                    <p className="text-[10px] font-black text-primary">
                      {Math.round(frame.euploidProbability * 100)}%
                    </p>
                    <p className="text-[9px] text-on-surface-variant">
                      Grade: {frame.grade}
                    </p>
                    <p className="text-[9px] text-on-surface-variant/60">
                      #{frame.rank}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="col-span-12 flex h-full flex-col rounded border border-surface-dim/30 bg-surface-lowest shadow-[0_8px_32px_rgba(25,28,30,0.04)] backdrop-blur-md lg:col-span-4">
        <div className="border-b border-surface-low p-6">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-on-surface">
            AI Analysis Reasoning
          </h3>
          <div className="rounded border border-surface-dim/30 border-l-2 border-l-primary bg-surface p-4">
            <p className="text-xs italic leading-relaxed text-on-surface-variant">
              &quot;{prediction
                ? reasoningFromResult(prediction.lrEupAnu, prediction.lrEupCxa)
                : 'Upload at least 9 embryo images and click Run BELA Analysis to generate predictions.'}&quot;
            </p>
          </div>

          {prediction && dominantModel && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded border border-surface-dim/30 bg-surface p-2 text-center shadow-sm">
                <p className="text-[9px] uppercase tracking-widest text-on-surface-variant">ICM Quality</p>
                <p className="text-xs font-bold text-primary">{icmLabel(dominantModel.icmScore)}</p>
              </div>
              <div className="rounded border border-surface-dim/30 bg-surface p-2 text-center shadow-sm">
                <p className="text-[9px] uppercase tracking-widest text-on-surface-variant">Expansion</p>
                <p className="text-xs font-bold text-primary">{expansionLabel(dominantModel.expansionScore)}</p>
              </div>
              <div className="rounded border border-surface-dim/30 bg-surface p-2 text-center shadow-sm">
                <p className="text-[9px] uppercase tracking-widest text-on-surface-variant">Blastocyst Score</p>
                <p className="text-xs font-bold text-primary">{dominantModel.blastocystScore.toFixed(2)}</p>
              </div>
              <div className="rounded border border-surface-dim/30 bg-surface p-2 text-center shadow-sm">
                <p className="text-[9px] uppercase tracking-widest text-on-surface-variant">Trophectoderm</p>
                <p className="text-xs font-bold text-primary">{(dominantModel.trophectodermScore * 100).toFixed(0)}%</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-5 p-6">
          {prediction && (
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-on-surface">
                Visual Comparison
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'EUP/ANU', prob: prediction.lrEupAnu.euploidProbablity },
                  { id: 'EUP/CxA', prob: prediction.lrEupCxa.euploidProbablity },
                ].map(m => (
                  <div
                    key={m.id}
                    className="relative aspect-square overflow-hidden rounded border border-surface-dim/30 bg-surface shadow-sm"
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-primary/20"
                      style={{ height: `${Math.round(m.prob * 100)}%` }}
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-black text-on-surface">{m.id}</span>
                      <span className="text-lg font-black text-primary">
                        {Math.round(m.prob * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-on-surface">
              Clinical Override
            </h3>
            <textarea
              value={clinicalNote}
              onChange={e => setClinicalNote(e.target.value)}
              className="min-h-[110px] w-full rounded border border-surface-dim/30 bg-surface p-3 text-xs text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter manual grading adjustments or clinical observations..."
            />
            <label className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-on-surface-variant cursor-pointer">
              <input
                type="checkbox"
                checked={verified}
                onChange={e => setVerified(e.target.checked)}
                className="rounded border-surface-dim bg-surface"
              />
              Verify AI assessment for transfer
            </label>
          </div>
        </div>

        <div className="border-t border-surface-low p-6">
          <button
            disabled={!prediction || !verified}
            className="w-full rounded bg-gradient-to-r from-primary to-primary-container py-4 text-xs font-black uppercase tracking-[0.2em] text-primary-foreground hover:opacity-90 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Finalize Selection
          </button>
          <button className="mt-3 w-full py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface">
            Save for Peer Review
          </button>
          <div className="mt-4 flex items-center gap-2 rounded border border-primary/20 bg-primary/10 p-3 text-[11px] text-primary">
            <Brain className="size-4" />
            {prediction
              ? 'BELA predictions powered by embryo-ai-backend (live).'
              : 'AI model calibrated with 12,480 historical embryo outcomes.'}
          </div>
        </div>
      </aside>
    </div>
  )
}
