import { Market, Platform } from '../types'
import { fetchPolymarketMarkets } from './polymarket'
import { fetchKalshiMarkets } from './kalshi'
import { fetchOpinionMarkets, fetchOpinionTopics } from './opinion'

// In-memory cache
const cache = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL = 60_000 // 1 minute

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data as T
  cache.delete(key)
  return null
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, ts: Date.now() })
}

export interface FetchOptions {
  platforms?: Platform[]
  category?: string
  search?: string
  sort?: 'volume' | 'newest' | 'ending_soon' | 'price'
  limit?: number
}

export async function fetchAllMarkets(options: FetchOptions = {}): Promise<Market[]> {
  const {
    platforms = ['polymarket', 'kalshi', 'opinion'],
    category,
    search,
    sort = 'volume',
    limit = 20,
  } = options

  const cacheKey = `markets:${platforms.join(',')}:${limit}`
  const cached = getCached<Market[]>(cacheKey)
  if (cached) {
    return filterAndSort(cached, { category, search, sort })
  }

  const fetchers: Promise<Market[]>[] = []

  if (platforms.includes('polymarket')) {
    fetchers.push(fetchPolymarketMarkets(limit).catch(() => []))
  }
  if (platforms.includes('kalshi')) {
    fetchers.push(fetchKalshiMarkets(limit).then(r => r.markets).catch(() => []))
  }
  if (platforms.includes('opinion')) {
    fetchers.push(
      Promise.all([
        fetchOpinionMarkets(limit).catch(() => []),
        fetchOpinionTopics(limit).catch(() => []),
      ]).then(([indicators, topics]) => {
        // Combine and deduplicate
        const all = [...indicators, ...topics]
        const seen = new Set<string>()
        return all.filter(m => {
          if (seen.has(m.id)) return false
          seen.add(m.id)
          return true
        })
      })
    )
  }

  const results = await Promise.all(fetchers)
  // Filter out closed/resolved markets and extreme probabilities
  const allMarkets = results.flat().filter(m => {
    if (m.status === 'closed' || m.status === 'resolved') return false
    // For binary markets (2 outcomes), skip if essentially resolved (>90%)
    if (m.outcomes.length === 2) {
      const topPrice = Math.max(...m.outcomes.map(o => o.price))
      if (topPrice > 0.90) return false
    }
    // For multi-outcome markets, skip if any single outcome > 95%
    if (m.outcomes.length > 2) {
      const topPrice = Math.max(...m.outcomes.map(o => o.price))
      if (topPrice > 0.95) return false
    }
    return true
  })

  setCache(cacheKey, allMarkets)
  return filterAndSort(allMarkets, { category, search, sort })
}

function filterAndSort(
  markets: Market[],
  opts: { category?: string; search?: string; sort?: string }
): Market[] {
  let filtered = [...markets]

  if (opts.category && opts.category !== 'All') {
    filtered = filtered.filter(m =>
      m.category?.toLowerCase() === opts.category!.toLowerCase()
    )
  }

  if (opts.search) {
    const q = opts.search.toLowerCase()
    filtered = filtered.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q) ||
      m.category?.toLowerCase().includes(q)
    )
  }

  switch (opts.sort) {
    case 'volume':
      filtered.sort((a, b) => (b.volume || 0) - (a.volume || 0))
      break
    case 'newest':
      filtered.sort((a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      )
      break
    case 'ending_soon':
      filtered.sort((a, b) => {
        const aEnd = a.endDate ? new Date(a.endDate).getTime() : Infinity
        const bEnd = b.endDate ? new Date(b.endDate).getTime() : Infinity
        return aEnd - bEnd
      })
      break
    case 'price':
      filtered.sort((a, b) => {
        const aPrice = Math.max(...a.outcomes.map(o => o.price))
        const bPrice = Math.max(...b.outcomes.map(o => o.price))
        return bPrice - aPrice
      })
      break
  }

  return filtered
}

// Search for macro/economics-related markets across all platforms
export async function fetchMacroMarkets(): Promise<Market[]> {
  const allMarkets = await fetchAllMarkets({
    platforms: ['polymarket', 'kalshi', 'opinion'],
    limit: 50,
  })

  const macroKeywords = [
    'fed', 'fomc', 'rate', 'interest', 'inflation', 'cpi', 'gdp',
    'employment', 'jobs', 'nonfarm', 'payroll', 'unemployment',
    'treasury', 'yield', 'recession', 'economic', 'fiscal',
    'monetary', 'central bank', 'powell', 'tariff',
  ]

  return allMarkets.filter(m => {
    const text = `${m.title} ${m.description || ''} ${m.category || ''}`.toLowerCase()
    return macroKeywords.some(kw => text.includes(kw)) ||
      m.category === 'Economics' || m.category === 'Macro' || m.category === 'Rates'
  })
}
