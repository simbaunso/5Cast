'use client'

import SimulationPanel from '@/components/SimulationPanel'
import { Brain } from 'lucide-react'

export default function SimulationPage() {
  return (
    <div className="space-y-6">
      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8" style={{ color: 'var(--accent-blue)' }} />
          <h1 className="text-2xl sm:text-3xl font-bold">
            <span className="gradient-text">Simulation Playground</span>
          </h1>
        </div>
        <p className="text-sm max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
          Simulate macro events using a panel of 5 AI agents: Market Analyst, Macro Economist, Regional Pragmatist,
          Academic Balancer, and Central Policymaker. Each agent uses Chain-of-Draft reasoning
          to produce probability forecasts, which are then compared against real prediction market data.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          {['Chain-of-Draft', 'Multi-Agent', 'Real-time Comparison', 'Moments Analysis'].map(tag => (
            <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#93C5FD' }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      <SimulationPanel />
    </div>
  )
}
