import { Market, Outcome } from '../types'

const CORS_PROXY = 'https://corsproxy.io/?'
const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2'

export async function fetchKalshiMarkets(limit = 20, cursor?: string): Promise<{ markets: Market[]; cursor?: string }> {
  const params = new URLSearchParams({
    status: 'open', limit: String(limit), with_nested_markets: 'true',
  })
  if (cursor) params.set('cursor', cursor)

  const url = `${CORS_PROXY}${encodeURIComponent(`${KALSHI_API}/events?${params}`)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Kalshi API error: ${res.status}`)
  const data = await res.json()

  const markets: Market[] = []
  for (const event of data.events || []) {
    const eventMarkets = event.markets || []
    if (!eventMarkets.length) continue

    const primary = eventMarkets[0]
    let outcomes: Outcome[] = []

    if (eventMarkets.length === 1) {
      const yesPrice = primary.yes_ask_dollars
        ? parseFloat(primary.yes_ask_dollars)
        : (primary.yes_ask || 50) / 100
      const noPrice = primary.no_ask_dollars
        ? parseFloat(primary.no_ask_dollars)
        : (primary.no_ask || 50) / 100
      outcomes = [
        { label: 'Yes', price: yesPrice, tokenId: primary.ticker },
        { label: 'No', price: noPrice, tokenId: primary.ticker },
      ]
    } else {
      outcomes = eventMarkets.map((m: Record<string, unknown>) => {
        const price = m.yes_ask_dollars
          ? parseFloat(m.yes_ask_dollars as string)
          : ((m.yes_ask as number) || 50) / 100
        return {
          label: (m.title as string) || (m.subtitle as string) || 'Unknown',
          price,
          tokenId: m.ticker as string,
        }
      })
    }

    const totalVolume = eventMarkets.reduce(
      (sum: number, m: Record<string, unknown>) => sum + ((m.volume as number) || 0), 0
    )
    const totalVolume24h = eventMarkets.reduce(
      (sum: number, m: Record<string, unknown>) => sum + ((m.volume_24h as number) || 0), 0
    )
    const totalLiquidity = eventMarkets.reduce(
      (sum: number, m: Record<string, unknown>) => {
        const liq = m.liquidity_dollars ? parseFloat(m.liquidity_dollars as string) : 0
        return sum + liq
      }, 0
    )

    markets.push({
      id: event.event_ticker,
      platform: 'kalshi',
      title: event.title + (event.sub_title ? ` - ${event.sub_title}` : ''),
      description: primary.rules_primary,
      category: mapKalshiCategory(event.category),
      url: `https://kalshi.com/markets/${event.event_ticker}`,
      outcomes,
      volume: totalVolume,
      volume24h: totalVolume24h,
      liquidity: totalLiquidity,
      status: 'active',
      endDate: primary.close_time,
      slug: event.event_ticker,
      extra: {
        seriesTicker: event.series_ticker,
        mutuallyExclusive: event.mutually_exclusive,
        primaryTicker: primary.ticker,
      },
    })
  }

  return { markets, cursor: data.cursor }
}

function mapKalshiCategory(cat?: string): string {
  if (!cat) return 'Other'
  const c = cat.toLowerCase()
  if (c.includes('election') || c.includes('politic') || c.includes('congress')) return 'Politics'
  if (c.includes('crypto') || c.includes('bitcoin')) return 'Crypto'
  if (c.includes('econ') || c.includes('fed') || c.includes('rate') || c.includes('gdp') || c.includes('inflation') || c.includes('financial')) return 'Economics'
  if (c.includes('climate') || c.includes('weather') || c.includes('hurricane')) return 'Climate'
  if (c.includes('tech') || c.includes('ai')) return 'Tech'
  if (c.includes('sport')) return 'Sports'
  return 'Other'
}
