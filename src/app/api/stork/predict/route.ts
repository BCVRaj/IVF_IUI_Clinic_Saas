import { NextRequest, NextResponse } from 'next/server'

const STORK_URL      = process.env.STORK_V_URL ?? 'http://localhost:8081'
const INTERNAL_KEY   = process.env.EMBRYO_AI_INTERNAL_KEY ?? 'femi-internal-2024'

export async function POST(req: NextRequest) {
  let upstream: Response
  try {
    const body = await req.formData()
    upstream = await fetch(`${STORK_URL}/api/stork/predict`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${INTERNAL_KEY}` },
      body,
    })
  } catch {
    return NextResponse.json(
      { error: 'Could not reach embryo-ai-backend. Is it running?' },
      { status: 502 },
    )
  }

  const json = await upstream.json()
  return NextResponse.json(json, { status: upstream.status })
}
