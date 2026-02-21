'use client'

import { Platform } from '@/lib/types'
import { Search, SlidersHorizontal } from 'lucide-react'

const CATEGORIES = ['All', 'Economics', 'Politics', 'Crypto', 'Tech', 'Sports', 'Macro', 'Climate', 'Culture']
const SORT_OPTIONS = [
  { value: 'volume', label: 'Volume' },
  { value: 'newest', label: 'Newest' },
  { value: 'ending_soon', label: 'Ending Soon' },
  { value: 'price', label: 'Price' },
]
const PLATFORMS: { value: Platform; label: string; color: string }[] = [
  { value: 'polymarket', label: 'Polymarket', color: '#3B82F6' },
  { value: 'kalshi', label: 'Kalshi', color: '#8B5CF6' },
  { value: 'opinion', label: 'Opinion', color: '#EAB308' },
]

interface FilterBarProps {
  search: string
  onSearchChange: (s: string) => void
  category: string
  onCategoryChange: (c: string) => void
  sort: string
  onSortChange: (s: string) => void
  platforms: Platform[]
  onPlatformsChange: (p: Platform[]) => void
}

export default function FilterBar({
  search, onSearchChange,
  category, onCategoryChange,
  sort, onSortChange,
  platforms, onPlatformsChange,
}: FilterBarProps) {
  const togglePlatform = (p: Platform) => {
    if (platforms.includes(p)) {
      if (platforms.length > 1) {
        onPlatformsChange(platforms.filter(x => x !== p))
      }
    } else {
      onPlatformsChange([...platforms, p])
    }
  }

  return (
    <div className="space-y-3">
      {/* Search + Sort */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search markets..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-1"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <div className="relative">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <select
            value={sort}
            onChange={e => onSortChange(e.target.value)}
            className="pl-10 pr-8 py-2.5 rounded-xl text-sm outline-none appearance-none cursor-pointer"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Platform toggles + Categories */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Platform pills */}
        {PLATFORMS.map(p => {
          const active = platforms.includes(p.value)
          return (
            <button
              key={p.value}
              onClick={() => togglePlatform(p.value)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: active ? `${p.color}22` : 'var(--bg-card)',
                border: `1px solid ${active ? `${p.color}55` : 'var(--border)'}`,
                color: active ? p.color : 'var(--text-muted)',
                opacity: active ? 1 : 0.6,
              }}
            >
              {p.label}
            </button>
          )
        })}

        <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />

        {/* Category pills */}
        {CATEGORIES.map(cat => {
          const active = category === cat
          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                border: active ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                color: active ? '#93C5FD' : 'var(--text-muted)',
              }}
            >
              {cat}
            </button>
          )
        })}
      </div>
    </div>
  )
}
