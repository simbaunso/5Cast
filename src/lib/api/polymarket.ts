import { Market, Outcome } from '../types'

const GAMMA_API = 'https://gamma-api.polymarket.com'

export async function fetchPolymarketMarkets(limit = 20, offset = 0): Promise<Market[]> {
  const params = new URLSearchParams({
    active: 'true', closed: 'false', limit: String(limit),
    offset: String(offset), order: 'volume24hr', ascending: 'false',
  })
  const res = await fetch(`${GAMMA_API}/events?${params}`)
  if (!res.ok) throw new Error(`Polymarket API error: ${res.status}`)
  const events = await res.json()
  if (!Array.isArray(events)) return []

  const markets: Market[] = []
  for (const event of events) {
    if (!event.markets?.length) continue
    // Skip closed events
    if (event.closed === true) continue

    const primary = event.markets[0]
    let outcomes: Outcome[] = []

    try {
      const labels = JSON.parse(primary.outcomes || '[]')
      const prices = JSON.parse(primary.outcomePrices || '[]')
      const tokens = JSON.parse(primary.clobTokenIds || '[]')
      outcomes = labels.map((label: string, i: number) => ({
        label,
        price: parseFloat(prices[i] || '0'),
        tokenId: tokens[i],
      }))
    } catch {
      outcomes = [{ label: 'Yes', price: 0.5 }, { label: 'No', price: 0.5 }]
    }

    if (event.markets.length > 1) {
      outcomes = event.markets
        .filter((m: Record<string, unknown>) => m.closed !== true && m.active !== false)
        .map((m: Record<string, unknown>) => {
          const prices = JSON.parse((m.outcomePrices as string) || '["0.5","0.5"]')
          const tokens = JSON.parse((m.clobTokenIds as string) || '[]')
          return {
            label: (m.question as string) || (m.groupItemTitle as string) || 'Unknown',
            price: parseFloat(prices[0] || '0'),
            tokenId: tokens[0],
          }
        })
    }

    markets.push({
      id: String(event.id),
      platform: 'polymarket',
      title: event.title,
      description: event.description,
      category: mapPolyCategory(event),
      imageUrl: event.image,
      url: `https://polymarket.com/event/${event.slug}`,
      outcomes,
      volume: event.volume || 0,
      volume24h: event.volume24hr || 0,
      liquidity: event.liquidity || 0,
      status: 'active',
      createdAt: event.startDate,
      endDate: event.endDate,
      slug: event.slug,
      extra: {
        conditionId: primary.conditionId,
        clobTokenIds: primary.clobTokenIds,
        tags: event.markets?.[0]?.tags,
      },
    })
  }

  return markets
}

function mapPolyCategory(event: Record<string, unknown>): string {
  const markets = event.markets as Record<string, unknown>[]
  if (!markets?.[0]) return 'Other'
  const tags = markets[0].tags as { slug: string }[] | undefined
  if (!tags?.length) return 'Other'
  const slugs = tags.map(t => t.slug?.toLowerCase() || '')
  if (slugs.some(s => s.includes('politic') || s.includes('election'))) return 'Politics'
  if (slugs.some(s => s.includes('crypto') || s.includes('bitcoin') || s.includes('ethereum'))) return 'Crypto'
  if (slugs.some(s => s.includes('sport'))) return 'Sports'
  if (slugs.some(s => s.includes('econ') || s.includes('fed') || s.includes('rate') || s.includes('inflation'))) return 'Economics'
  if (slugs.some(s => s.includes('tech') || s.includes('ai'))) return 'Tech'
  if (slugs.some(s => s.includes('entertainment') || s.includes('culture'))) return 'Culture'
  return 'Other'
}
