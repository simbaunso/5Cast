'use client'

import { useState, useEffect } from 'react'
import { SimulationResult } from '@/lib/types'
import { getSavedSimulations } from '@/lib/storage'
import { formatPrice, timeAgo } from '@/lib/utils'
import { Trophy, Clock, Brain, Trash2 } from 'lucide-react'
import { deleteSimulation } from '@/lib/storage'

export default function LeaderboardPage() {
  const [simulations, setSimulations] = useState<SimulationResult[]>([])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSimulations(getSavedSimulations())
  }, [])

  const handleDelete = (id: string) => {
    deleteSimulation(id)
    setSimulations(prev => prev.filter(s => s.id !== id))
  }

  // Sort by how close aggregated prob is to market consensus (gap)
  const ranked = simulations
    .filter(s => s.status === 'completed')
    .map(s => {
      const marketAvg = s.marketComparison.length > 0
        ? s.marketComparison.reduce((sum, m) => sum + m.probability, 0) / s.marketComparison.length
        : 0.5
      const gap = Math.abs(s.aggregatedProbability - marketAvg)
      return { ...s, marketAvg, gap }
    })
    .sort((a, b) => a.gap - b.gap) // Most aligned first

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8" style={{ color: 'var(--accent-orange)' }} />
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="gradient-text">Simulation Leaderboard</span>
          </h1>
        </div>
        <p className="text-sm max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
          Track simulation accuracy. Simulations are ranked by how closely they align with real
          prediction market consensus. The most accurate simulations appear first.
        </p>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card-sm p-4">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Total Simulations</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--accent-blue)' }}>{simulations.length}</div>
        </div>
        <div className="glass-card-sm p-4">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Avg Gap</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--accent-green)' }}>
            {ranked.length > 0 ? `${(ranked.reduce((s, r) => s + r.gap, 0) / ranked.length * 100).toFixed(1)}%` : '—'}
          </div>
        </div>
        <div className="glass-card-sm p-4">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Best Accuracy</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--accent-purple)' }}>
            {ranked.length > 0 ? `${(ranked[0].gap * 100).toFixed(1)}%` : '—'}
          </div>
        </div>
        <div className="glass-card-sm p-4">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Unique Events</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--accent-cyan)' }}>
            {new Set(simulations.map(s => s.eventType)).size}
          </div>
        </div>
      </div>

      {/* Simulation list */}
      {ranked.length > 0 ? (
        <div className="space-y-3">
          {ranked.map((sim, i) => (
            <div key={sim.id} className="glass-card-sm p-4">
              <div className="flex items-start gap-4">
                {/* Rank */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
                  style={{
                    background: i === 0 ? 'linear-gradient(135deg, #F59E0B, #EF4444)' :
                      i === 1 ? 'linear-gradient(135deg, #94A3B8, #CBD5E1)' :
                        i === 2 ? 'linear-gradient(135deg, #B45309, #D97706)' :
                          'var(--bg-primary)',
                    color: i < 3 ? 'white' : 'var(--text-muted)',
                  }}
                >
                  #{i + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{
                      background: 'rgba(59,130,246,0.1)',
                      border: '1px solid rgba(59,130,246,0.2)',
                      color: '#93C5FD',
                    }}>
                      {sim.eventType}
                    </span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Clock className="w-3 h-3" />
                      {timeAgo(sim.timestamp)}
                    </span>
                  </div>
                  <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {sim.question}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      AI: <span className="font-bold" style={{ color: 'var(--accent-blue)' }}>{formatPrice(sim.aggregatedProbability)}</span>
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Market: <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{formatPrice(sim.marketAvg)}</span>
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Gap: <span className="font-bold" style={{
                        color: sim.gap < 0.05 ? 'var(--accent-green)' : sim.gap < 0.15 ? 'var(--accent-orange)' : 'var(--accent-red)',
                      }}>{(sim.gap * 100).toFixed(1)}%</span>
                    </span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Brain className="w-3 h-3" />
                      {sim.agents.length} agents
                    </span>
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(sim.id)}
                  className="p-2 rounded-lg transition-colors shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                  title="Delete simulation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 glass-card">
          <Brain className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <div className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No simulations yet</div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Run your first simulation to see it appear here.
          </div>
        </div>
      )}
    </div>
  )
}
