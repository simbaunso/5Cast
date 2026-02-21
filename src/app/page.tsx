'use client'

import { useState, useMemo } from 'react'
import { Platform } from '@/lib/types'
import { useMarkets } from '@/hooks/useMarkets'
import PlatformStats from '@/components/PlatformStats'
import FilterBar from '@/components/FilterBar'
import MarketCard from '@/components/MarketCard'
import { RefreshCw, AlertTriangle, BarChart3 } from 'lucide-react'

export default function DashboardPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('volume')
  const [platforms, setPlatforms] = useState<Platform[]>(['polymarket', 'kalshi', 'opinion'])

  const options = useMemo(() => ({
    platforms,
    category: category === 'All' ? undefined : category,
    search: search || undefined,
    sort: sort as 'volume' | 'newest' | 'ending_soon' | 'price',
    limit: 30,
  }), [platforms, category, search, sort])

  const { markets, loading, error, refresh, platformCounts } = useMarkets(options)

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="glass-card p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          <span className="gradient-text">5Cast — 5-Agent Prediction Forecaster</span>
        </h1>
        <p className="text-sm sm:text-base max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
          AI-powered forecasting laboratory combining real-time prediction market data from
          <span style={{ color: '#60A5FA' }}> Polymarket</span>,
          <span style={{ color: '#A78BFA' }}> Kalshi</span>, and
          <span style={{ color: '#FACC15' }}> Opinion</span>.
          Research-grade tool for policymakers, researchers, and analysts.
        </p>
      </div>

      {/* Stats */}
      <PlatformStats counts={platformCounts} loading={loading} />

      {/* Filters */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        sort={sort}
        onSortChange={setSort}
        platforms={platforms}
        onPlatformsChange={setPlatforms}
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: 'var(--accent-orange)' }} />
          <div className="flex-1">
            <span className="text-sm" style={{ color: '#FCD34D' }}>Some data sources may be unavailable: {error}</span>
          </div>
          <button onClick={refresh} className="p-2 rounded-lg transition-colors" style={{ color: 'var(--accent-orange)' }}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card-sm p-4 space-y-3">
              <div className="flex justify-between">
                <div className="skeleton h-6 w-20" />
                <div className="skeleton h-4 w-16" />
              </div>
              <div className="skeleton h-5 w-full" />
              <div className="skeleton h-4 w-3/4" />
              <div className="space-y-2">
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-2/3" />
              </div>
              <div className="flex justify-between pt-2" style={{ borderTop: '1px solid var(--glass-border)' }}>
                <div className="skeleton h-4 w-16" />
                <div className="skeleton h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Markets Grid */}
      {!loading && markets.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Showing {markets.length} markets
            </span>
            <button onClick={refresh} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors" style={{ color: 'var(--accent-blue)', background: 'rgba(59,130,246,0.1)' }}>
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {markets.map(market => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && markets.length === 0 && !error && (
        <div className="text-center py-16">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-20" style={{ color: 'var(--text-muted)' }} />
          <div className="text-lg font-semibold mb-2 text-[var(--text-primary)]">No markets found</div>
          <div className="text-sm text-[var(--text-muted)]">Try adjusting your filters or search query.</div>
        </div>
      )}
    </div>
  )
}
