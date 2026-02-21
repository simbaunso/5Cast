import { NextRequest, NextResponse } from 'next/server'

// Global rate limiter: 3 calls per day total across all users
// Resets at midnight UTC
let callCount = 0
let resetDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD

function checkAndIncrementLimit(): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().split('T')[0]
  if (today !== resetDate) {
    callCount = 0
    resetDate = today
  }

  if (callCount >= 3) {
    return { allowed: false, remaining: 0 }
  }

  callCount++
  return { allowed: true, remaining: 3 - callCount }
}

function getRemainingCalls(): number {
  const today = new Date().toISOString().split('T')[0]
  if (today !== resetDate) {
    return 3
  }
  return Math.max(0, 3 - callCount)
}

// GET: Check remaining calls
export async function GET() {
  return NextResponse.json({ remaining: getRemainingCalls(), limit: 3 })
}

// POST: Proxy LLM request to Grok API
export async function POST(req: NextRequest) {
  const apiKey = process.env.GROK_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI service not configured' },
      { status: 503 }
    )
  }

  const { allowed, remaining } = checkAndIncrementLimit()
  if (!allowed) {
    return NextResponse.json(
      { error: 'Daily AI limit reached (3/day). Try again tomorrow.', remaining: 0 },
      { status: 429 }
    )
  }

  try {
    const body = await req.json()

    // Only allow expected fields through
    const { messages, temperature, max_tokens } = body
    if (!messages || !Array.isArray(messages)) {
      callCount-- // refund on bad request
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini-fast',
        messages,
        temperature: temperature ?? 0.7,
        max_tokens: max_tokens ?? 500,
      }),
    })

    if (!res.ok) {
      callCount-- // refund on upstream error
      const errText = await res.text().catch(() => 'Unknown error')
      return NextResponse.json(
        { error: `AI service error: ${res.status}`, details: errText },
        { status: 502 }
      )
    }

    const data = await res.json()
    return NextResponse.json({ ...data, remaining })
  } catch (err) {
    callCount-- // refund on unexpected error
    return NextResponse.json(
      { error: 'AI service unavailable' },
      { status: 500 }
    )
  }
}
