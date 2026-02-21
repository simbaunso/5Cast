'use client'

import { useState, useEffect, useMemo } from 'react'
import { Market, Platform, PLATFORM_NAMES } from '@/lib/types'
import { fetchAllMarkets } from '@/lib/api/unified'
import { formatVolume, formatPrice, platformBgClass } from '@/lib/utils'
import { GitCompare, Loader2, ArrowUpDown, ExternalLink, Search } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const PLATFORM_CHART_COLORS: Record<Platform, string> = {
  polymarket: '#3B82F6',
  kalshi: '#8B5CF6',
  opinion: '#EAB308',
}

export default function ComparePage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'spread' | 'volume'>('spread')

  useEffect(() => {
    fetchAllMarkets({ limit: 50 })
      .then(setMarkets)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Group markets by similar titles for cross-platform comparison
  const comparisons = useMemo(() => {
    const groups: Map<string, Market[]> = new Map()

    for (const market of markets) {
      const key = normalizeTitle(market.title)
      const existing = groups.get(key)
      if (existing) {
        // Only add if from a different platform
        if (!existing.some(m => m.platform === market.platform)) {
          existing.push(market)
        }
      } else {
        groups.set(key, [market])
      }
    }

    // Also try fuzzy matching
    const keys = [...groups.keys()]
    for (let i = 0; i < keys.length; i++) {
      for (let j = i + 1; j < keys.length; j++) {
        const groupI = groups.get(keys[i])
        const groupJ = groups.get(keys[j])
        if (!groupI || !groupJ) continue
        if (jaccardSimilarity(keys[i], keys[j]) > 0.3) {
          const merged = [...groupI]
          for (const m of groupJ) {
            if (!merged.some(e => e.platform === m.platform)) {
              merged.push(m)
            }
          }
          if (merged.length > groupI.length) {
            groups.set(keys[i], merged)
            groups.delete(keys[j])
          }
        }
      }
    }

    return [...groups.values()]
      .filter(g => g.length >= 2) // At least 2 platforms
      .map(g => {
        const prices = g.map(m => m.outcomes[0]?.price || 0.5)
        const spread = Math.max(...prices) - Math.min(...prices)
        const totalVol = g.reduce((s, m) => s + m.volume, 0)
        return { markets: g, spread, totalVolume: totalVol }
      })
      .filter(c => {
        if (!search) return true
        const q = search.toLowerCase()
        return c.markets.some(m => m.title.toLowerCase().includes(q))
      })
      .sort((a, b) => sortBy === 'spread' ? b.spread - a.spread : b.totalVolume - a.totalVolume)
  }, [markets, search, sortBy])

  // Platform distribution chart
  const platformChartData = useMemo(() => {
    const counts: Record<Platform, number> = { polymarket: 0, kalshi: 0, opinion: 0 }
    markets.forEach(m => counts[m.platform]++)
    return Object.entries(counts).map(([platform, count]) => ({
      platform: PLATFORM_NAMES[platform as Platform],
      count,
      color: PLATFORM_CHART_COLORS[platform as Platform],
    }))
  }, [markets])

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-2">
          <GitCompare className="w-8 h-8" style={{ color: 'var(--accent-cyan)' }} />
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="gradient-text">Cross-Platform Comparison</span>
          </h1>
        </div>
        <p className="text-sm max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
          Compare probability estimates across Polymarket, Kalshi, and Opinion for similar events.
          Identify discrepancies and analyze cross-platform spreads.
        </p>
      </div>

      {/* Platform Distribution Chart */}
      {!loading && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Market Distribution by Platform</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformChartData}>
                <XAxis dataKey="platform" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1A2332', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#F1F5F9' }}
                  cursor={{ fill: 'rgba(59,130,246,0.05)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {platformChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Search + Sort */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search comparisons..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        />
        <button
          onClick={() => setSortBy(sortBy === 'spread' ? 'volume' : 'spread')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          <ArrowUpDown className="w-4 h-4" />
          Sort: {sortBy === 'spread' ? 'Spread' : 'Volume'}
        </button>
      </div>

      {loading && (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" style={{ color: 'var(--accent-blue)' }} />
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading market data...</div>
        </div>
      )}

      {/* Comparison Cards */}
      {!loading && comparisons.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {comparisons.length} cross-platform comparisons found
          </div>
          {comparisons.map((comp, i) => (
            <ComparisonCard key={i} {...comp} />
          ))}
        </div>
      )}

      {!loading && comparisons.length === 0 && (
        <div className="text-center py-16 glass-card">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-muted)' }} />
          <div className="text-lg font-semibold mb-2 text-[var(--text-primary)]">
            No cross-platform matches found
          </div>
          <div className="text-sm text-[var(--text-muted)]">
            Markets need to appear on at least 2 platforms for comparison.
          </div>
        </div>
      )}

      {/* All Markets Table */}
      {!loading && markets.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            All Markets ({markets.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left py-2 px-3 font-medium w-[100px]" style={{ color: 'var(--text-muted)' }}>Platform</th>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--text-muted)' }}>Market</th>
                  <th className="text-right py-2 px-3 font-medium w-[80px]" style={{ color: 'var(--text-muted)' }}>Prob</th>
                  <th className="text-right py-2 px-3 font-medium w-[90px]" style={{ color: 'var(--text-muted)' }}>Volume</th>
                </tr>
              </thead>
              <tbody>
                {markets.slice(0, 30).map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td className="py-2 px-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${platformBgClass(m.platform)}`}>
                        {PLATFORM_NAMES[m.platform]}
                      </span>
                    </td>
                    <td className="py-2 px-3 max-w-xs truncate" style={{ color: 'var(--text-primary)' }}>
                      <a href={m.url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                        {m.title}
                        <ExternalLink className="w-3 h-3 shrink-0" style={{ color: 'var(--text-muted)' }} />
                      </a>
                    </td>
                    <td className="py-2 px-3 text-right font-semibold tabular-nums" style={{ color: 'var(--accent-blue)' }}>
                      {formatPrice(m.outcomes[0]?.price || 0)}
                    </td>
                    <td className="py-2 px-3 text-right" style={{ color: 'var(--text-secondary)' }}>
                      {formatVolume(m.volume)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function ComparisonCard({ markets, spread, totalVolume }: { markets: Market[]; spread: number; totalVolume: number }) {
  const title = markets[0].title

  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{title}</h4>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {markets.length} platforms
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Total Vol: {formatVolume(totalVolume)}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Spread</div>
          <div className="text-lg font-bold tabular-nums" style={{
            color: spread < 0.05 ? 'var(--accent-green)' : spread < 0.15 ? 'var(--accent-orange)' : 'var(--accent-red)',
          }}>
            {(spread * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {markets.map((m, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${platformBgClass(m.platform)}`}>
              {PLATFORM_NAMES[m.platform]}
            </span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(m.outcomes[0]?.price || 0.5) * 100}%`,
                  background: PLATFORM_CHART_COLORS[m.platform],
                }}
              />
            </div>
            <span className="text-sm font-bold tabular-nums min-w-[50px] text-right" style={{ color: 'var(--text-primary)' }}>
              {formatPrice(m.outcomes[0]?.price || 0)}
            </span>
            <span className="text-xs min-w-[60px] text-right" style={{ color: 'var(--text-muted)' }}>
              {formatVolume(m.volume)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Utility functions
function normalizeTitle(title: string): string {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(w => w.length > 2)
    .sort()
    .join(' ')
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.split(' '))
  const setB = new Set(b.split(' '))
  const intersection = new Set([...setA].filter(x => setB.has(x)))
  const union = new Set([...setA, ...setB])
  return union.size > 0 ? intersection.size / union.size : 0
}
