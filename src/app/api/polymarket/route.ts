import { NextRequest, NextResponse } from 'next/server'

const GAMMA_API = 'https://gamma-api.polymarket.com'
const DATA_API = 'https://data-api.polymarket.com'
const CLOB_API = 'https://clob.polymarket.com'

const ALLOWED = ['events', 'markets', 'trades', 'prices-history', 'book', 'midpoint']

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const endpoint = searchParams.get('endpoint') || 'events'

  if (endpoint.includes('..') || !ALLOWED.some(e => endpoint === e || endpoint.startsWith(e + '/'))) {
    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 })
  }

  const params = new URLSearchParams()
  searchParams.forEach((v, k) => { if (k !== 'endpoint') params.set(k, v) })

  let base = GAMMA_API
  if (endpoint.startsWith('trades')) base = DATA_API
  else if (['prices-history', 'book', 'midpoint'].some(e => endpoint.startsWith(e))) base = CLOB_API

  try {
    const res = await fetch(`${base}/${endpoint}?${params}`, { next: { revalidate: 30 } })
    if (!res.ok) return NextResponse.json({ error: `Upstream: ${res.status}` }, { status: res.status })
    const data = await res.json()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
