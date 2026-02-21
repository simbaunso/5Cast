'use client'

import { Platform, PLATFORM_NAMES } from '@/lib/types'

interface PlatformStatsProps {
  counts: Record<Platform, number>
  loading?: boolean
}

const PLATFORM_CONFIG: { platform: Platform; gradient: string; glow: string }[] = [
  { platform: 'polymarket', gradient: 'linear-gradient(135deg, #2563EB, #3B82F6)', glow: 'glow-blue' },
  { platform: 'kalshi', gradient: 'linear-gradient(135deg, #7C3AED, #8B5CF6)', glow: 'glow-purple' },
  { platform: 'opinion', gradient: 'linear-gradient(135deg, #CA8A04, #EAB308)', glow: 'glow-orange' },
]

export default function PlatformStats({ counts, loading }: PlatformStatsProps) {
  const total = Object.values(counts).reduce((s, c) => s + c, 0)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Total */}
      <div className="glass-card-sm p-4 glow-blue">
        <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Total Markets</div>
        {loading ? (
          <div className="skeleton h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold" style={{ color: 'var(--accent-blue)' }}>{total}</div>
        )}
      </div>

      {/* Per platform */}
      {PLATFORM_CONFIG.map(({ platform, glow }) => (
        <div key={platform} className={`glass-card-sm p-4 ${glow}`}>
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
            {PLATFORM_NAMES[platform]}
          </div>
          {loading ? (
            <div className="skeleton h-8 w-12" />
          ) : (
            <div className="text-2xl font-bold" style={{ color: platform === 'polymarket' ? '#60A5FA' : platform === 'kalshi' ? '#A78BFA' : '#FACC15' }}>
              {counts[platform]}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
