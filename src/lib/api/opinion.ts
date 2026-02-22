import { Market } from '../types'

const CORS_PROXY = 'https://corsproxy.io/?'
const OPINION_PUBLIC = 'https://proxy.opinion.trade:8443/api/bsc/api/v2'

interface OpinionRelease {
  id: number
  period: string
  previousValue: string
  forecastValue: string
  value: string
  releaseTime: number
  status: number
  topicId: number
}

interface OpinionIndicator {
  id: number
  releaseId: number
  title: string
  titleShort: string
  description: string
  countryCode: string
  categoryIds: number[]
  unit: string
  frequency: string
  importance: number
  period: string
  releaseTime: number
  previousValue: string
  forecastValue: string
  chainId: string
  releases: OpinionRelease[]
}

const CATEGORY_MAP: Record<number, string> = {
  2: 'Rates',
  4: 'Commodities',
  6: 'Employment',
  8: 'GDP',
}

export async function fetchOpinionMarkets(limit = 20): Promise<Market[]> {
  try {
    const params = new URLSearchParams({
      per_page: Math.min(limit, 20).toString(),
      page: '1',
      chainId: '56',
    })

    const res = await fetch(`${CORS_PROXY}${encodeURIComponent(`${OPINION_PUBLIC}/indicator?${params}`)}`)
    if (!res.ok) throw new Error(`Opinion API error: ${res.status}`)
    const data = await res.json()
    if (data.errno !== 0) throw new Error(data.errmsg || 'Opinion API error')

    const indicators: OpinionIndicator[] = data.result?.list || []

    // Also fetch page 2 for more data
    let moreIndicators: OpinionIndicator[] = []
    try {
      const params2 = new URLSearchParams({
        per_page: Math.min(limit, 20).toString(),
        page: '2',
        chainId: '56',
      })
      const res2 = await fetch(`${CORS_PROXY}${encodeURIComponent(`${OPINION_PUBLIC}/indicator?${params2}`)}`)
      if (res2.ok) {
        const data2 = await res2.json()
        moreIndicators = data2.result?.list || []
      }
    } catch { /* ignore */ }

    // Deduplicate
    const allIndicators = [...indicators]
    const seen = new Set(indicators.map(i => `${i.id}_${i.releaseId}`))
    for (const ind of moreIndicators) {
      const key = `${ind.id}_${ind.releaseId}`
      if (!seen.has(key)) {
        allIndicators.push(ind)
        seen.add(key)
      }
    }

    return allIndicators.map(mapIndicatorToMarket)
  } catch (err) {
    console.warn('Opinion API error:', err)
    return []
  }
}

// Also try fetching from topic endpoint for more markets
export async function fetchOpinionTopics(limit = 20): Promise<Market[]> {
  try {
    const res = await fetch(`${CORS_PROXY}${encodeURIComponent(`${OPINION_PUBLIC}/topic?per_page=${limit}&page=1`)}`)
    if (!res.ok) return []
    const data = await res.json()
    if (data.errno !== 0) return []

    const topics = data.result?.list || data.result || []
    if (!Array.isArray(topics)) return []

    return topics.map((t: Record<string, unknown>) => {
      const yesPrice = parseFloat(String(t.yesBuyPrice || t.yesMarketPrice || 0.5))
      const noPrice = parseFloat(String(t.noBuyPrice || t.noMarketPrice || 0.5))
      const volume = parseFloat(String(t.volume || 0))
      const yesLabel = (t.yesLabel as string) || 'Yes'
      const noLabel = (t.noLabel as string) || 'No'
      const topicId = t.topicId || t.id

      return {
        id: `opinion_topic_${topicId}`,
        platform: 'opinion' as const,
        title: (t.title as string) || (t.name as string) || 'Unknown',
        description: (t.abstract as string) || (t.description as string) || '',
        category: mapOpinionCategory(t),
        imageUrl: t.thumbnailUrl as string,
        url: `https://opinion.trade/topic/${topicId}`,
        outcomes: [
          { label: yesLabel, price: yesPrice },
          { label: noLabel, price: noPrice || (1 - yesPrice) },
        ],
        volume,
        volume24h: parseFloat(String(t.volume24h || 0)),
        status: 'active' as const,
        endDate: t.cutoffTime ? new Date((t.cutoffTime as number) * 1000).toISOString() : undefined,
        slug: String(topicId),
      }
    })
  } catch {
    return []
  }
}

function mapIndicatorToMarket(ind: OpinionIndicator): Market {
  const forecast = parseFloat(ind.forecastValue) || 0
  const previous = parseFloat(ind.previousValue) || 0
  const diff = previous > 0 ? (forecast - previous) / previous : 0
  const yesPrice = Math.min(Math.max(0.5 + diff * 2, 0.05), 0.95)

  const categoryName = ind.categoryIds?.length
    ? CATEGORY_MAP[ind.categoryIds[0]] || 'Macro'
    : 'Macro'

  const now = Date.now() / 1000
  const upcoming = ind.releases
    ?.filter(r => r.releaseTime > now)
    ?.sort((a, b) => a.releaseTime - b.releaseTime)?.[0]
  const active = upcoming || ind.releases?.[ind.releases.length - 1]
  const releaseTime = active?.releaseTime || ind.releaseTime
  const period = active?.period || ind.period
  const forecastVal = active?.forecastValue || ind.forecastValue
  const prevVal = active?.previousValue || ind.previousValue

  return {
    id: `opinion_${ind.id}_${active?.id || ind.releaseId}`,
    platform: 'opinion',
    title: `${ind.title} (${period}) — Forecast: ${forecastVal}${ind.unit}`,
    description: ind.description || `${ind.title}: Previous ${prevVal}${ind.unit}, Forecast ${forecastVal}${ind.unit}`,
    category: categoryName,
    url: 'https://opinion.trade/macro',
    outcomes: [
      { label: `Above ${forecastVal}${ind.unit}`, price: yesPrice },
      { label: `Below ${forecastVal}${ind.unit}`, price: 1 - yesPrice },
    ],
    volume: ind.importance * 10000,
    volume24h: ind.importance * 1000,
    liquidity: ind.importance * 5000,
    status: 'active',
    endDate: releaseTime ? new Date(releaseTime * 1000).toISOString() : undefined,
    slug: String(ind.id),
    extra: {
      countryCode: ind.countryCode,
      frequency: ind.frequency,
      importance: ind.importance,
      unit: ind.unit,
      previousValue: prevVal,
      forecastValue: forecastVal,
    },
  }
}

function mapOpinionCategory(t: Record<string, unknown>): string {
  const labels = t.labelName as string[] | undefined
  if (!labels?.length) return 'Macro'
  const first = labels[0]?.toLowerCase() || ''
  if (first.includes('crypto') || first.includes('defi')) return 'Crypto'
  if (first.includes('politic')) return 'Politics'
  if (first.includes('sport')) return 'Sports'
  if (first.includes('econ') || first.includes('rate') || first.includes('macro')) return 'Economics'
  return 'Macro'
}
