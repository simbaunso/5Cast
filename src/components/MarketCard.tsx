'use client'

import { Market } from '@/lib/types'
import { formatVolume, formatPrice, timeUntil, platformBgClass } from '@/lib/utils'
import { ExternalLink, Clock, TrendingUp, DollarSign } from 'lucide-react'

interface MarketCardProps {
  market: Market
  compact?: boolean
  onSelect?: (market: Market) => void
}

export default function MarketCard({ market, compact, onSelect }: MarketCardProps) {
  const mainOutcome = market.outcomes[0]
  const isMultiOutcome = market.outcomes.length > 2

  return (
    <div
      className="market-card glass-card-sm p-4 transition-all duration-200 cursor-pointer group"
      onClick={() => onSelect?.(market)}
    >
      {/* Top row: platform badge + end date */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${platformBgClass(market.platform)}`}>
          {market.platform.charAt(0).toUpperCase() + market.platform.slice(1)}
        </span>
        {market.endDate && (
          <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <Clock className="w-3 h-3" />
            {timeUntil(market.endDate)}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold leading-snug mb-3 line-clamp-2 text-[var(--text-primary)]">
        {market.title}
      </h3>

      {/* Outcomes */}
      {!compact && (
        <div className="space-y-2 mb-3">
          {market.outcomes.slice(0, isMultiOutcome ? 4 : 2).map((outcome, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <span className="text-xs truncate flex-1 text-[var(--text-secondary)]">
                {outcome.label}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full overflow-hidden bg-[var(--bg-primary)]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(outcome.price * 100, 2)}%`,
                      background: i === 0
                        ? 'linear-gradient(90deg, #3B82F6, #8B5CF6)'
                        : 'linear-gradient(90deg, #64748B, #94A3B8)',
                    }}
                  />
                </div>
                <span
                  className={`text-xs font-bold tabular-nums min-w-[40px] text-right ${i === 0 ? 'text-[#93C5FD]' : 'text-[var(--text-secondary)]'}`}
                >
                  {formatPrice(outcome.price)}
                </span>
              </div>
            </div>
          ))}
          {isMultiOutcome && market.outcomes.length > 4 && (
            <span className="text-xs text-[var(--text-muted)]">
              +{market.outcomes.length - 4} more outcomes
            </span>
          )}
        </div>
      )}

      {compact && mainOutcome && (
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-2 rounded-full overflow-hidden bg-[var(--bg-primary)]">
            <div
              className="h-full rounded-full"
              style={{
                width: `${mainOutcome.price * 100}%`,
                background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
              }}
            />
          </div>
          <span className="text-sm font-bold text-[#93C5FD]">
            {formatPrice(mainOutcome.price)}
          </span>
        </div>
      )}

      {/* Bottom: Volume + link */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--glass-border)]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <DollarSign className="w-3 h-3" />
            {formatVolume(market.volume)}
          </span>
          {market.liquidity ? (
            <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <TrendingUp className="w-3 h-3" />
              {formatVolume(market.liquidity)}
            </span>
          ) : null}
        </div>
        <a
          href={market.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-1 text-xs font-medium transition-colors text-[var(--accent-blue)] hover:text-[#93C5FD]"
        >
          View <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}
