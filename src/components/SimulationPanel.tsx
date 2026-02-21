'use client'

import { useState, useEffect } from 'react'
import { SimulationResult, AgentVote, MarketComparison, Market, AppSettings, DEFAULT_SETTINGS } from '@/lib/types'
import { PRESET_EVENTS, runSimulation } from '@/lib/simulation/engine'
import { fetchMacroMarkets, fetchAllMarkets } from '@/lib/api/unified'
import { getSettings, saveSimulation } from '@/lib/storage'
import { formatPrice, formatVolume } from '@/lib/utils'
import { Zap, Brain, ChevronDown, ChevronRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function SimulationPanel() {
  const [question, setQuestion] = useState('')
  const [eventType, setEventType] = useState('')
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [macroMarkets, setMacroMarkets] = useState<Market[]>([])
  const [allMarkets, setAllMarkets] = useState<Market[]>([])
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)
  const [loadingMarkets, setLoadingMarkets] = useState(true)

  useEffect(() => {
    setSettings(getSettings())
    Promise.all([
      fetchMacroMarkets().catch(() => []),
      fetchAllMarkets({ limit: 50 }).catch(() => []),
    ]).then(([macro, all]) => {
      setMacroMarkets(macro)
      setAllMarkets(all)
    }).finally(() => setLoadingMarkets(false))
  }, [])

  const handleRun = async () => {
    if (!question.trim()) return
    setRunning(true)
    setError(null)
    setResult(null)

    try {
      // Find related markets
      // Use preset keywords if available, otherwise extract from question
      const preset = PRESET_EVENTS.find(p => p.question === question)
      const keywords = preset
        ? preset.keywords
        : question.toLowerCase().split(/\s+/).filter(w => w.length > 2)

      // If data hasn't loaded yet, fetch fresh data
      let searchPool = [...macroMarkets, ...allMarkets]
      if (searchPool.length === 0) {
        const { fetchAllMarkets, fetchMacroMarkets } = await import('@/lib/api/unified')
        const [macro, all] = await Promise.all([
          fetchMacroMarkets().catch(() => []),
          fetchAllMarkets({ limit: 50 }).catch(() => []),
        ])
        searchPool = [...macro, ...all]
        setMacroMarkets(macro)
        setAllMarkets(all)
      }

      const seen = new Set<string>()
      const related = searchPool.filter(m => {
        if (seen.has(m.id)) return false
        seen.add(m.id)
        const text = `${m.title} ${m.description || ''} ${m.category || ''}`.toLowerCase()
        return keywords.some(kw => text.includes(kw))
      }).slice(0, 6)

      // If no related markets found, use macro markets or all markets as context
      const marketsToUse = related.length > 0
        ? related
        : searchPool.filter(m => m.category === 'Economics' || m.category === 'Macro' || m.category === 'Rates').slice(0, 6)

      const sim = await runSimulation(question, eventType || 'Custom Event', marketsToUse, settings)
      setResult(sim)
      saveSimulation(sim)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation failed')
    } finally {
      setRunning(false)
    }
  }

  const selectPreset = (preset: typeof PRESET_EVENTS[0]) => {
    setQuestion(preset.question)
    setEventType(preset.eventType)
  }

  return (
    <div className="space-y-6">
      {/* Preset Events */}
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Quick Start — Preset Events</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {PRESET_EVENTS.map((preset, i) => (
            <button
              key={i}
              onClick={() => selectPreset(preset)}
              className={`text-left p-3 rounded-xl text-sm preset-card ${question === preset.question ? 'active' : ''}`}
              style={{
                background: question === preset.question ? undefined : 'var(--bg-card)',
                border: `1px solid ${question === preset.question ? 'rgba(59,130,246,0.3)' : 'var(--border)'}`,
                color: question === preset.question ? '#93C5FD' : 'var(--text-secondary)',
              }}
            >
              <div className="font-medium text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{preset.eventType}</div>
              <div>{preset.question}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom question */}
      <div className="glass-card p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Type your macro event question..."
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRun()}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <button
            onClick={handleRun}
            disabled={running || !question.trim()}
            className="px-6 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 justify-center shrink-0 disabled:opacity-40"
            style={{
              background: running ? 'var(--bg-card)' : 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              color: 'white',
            }}
          >
            {running ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Running Simulation...</>
            ) : (
              <><Zap className="w-4 h-4" /> Run Simulation</>
            )}
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Mode: {settings.llmProvider === 'none' ? 'Rule-based (fast)' : `LLM: ${settings.llmProvider}`}
          </span>
          {loadingMarkets && (
            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--accent-blue)' }}>
              <Loader2 className="w-3 h-3 animate-spin" /> Loading market data...
            </span>
          )}
          {!loadingMarkets && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {macroMarkets.length} macro + {allMarkets.length} total markets loaded
            </span>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle className="w-4 h-4" style={{ color: 'var(--accent-red)' }} />
          <span className="text-sm" style={{ color: '#FCA5A5' }}>{error}</span>
        </div>
      )}

      {/* Running animation */}
      {running && (
        <div className="glass-card p-8 text-center pulse-glow">
          <Brain className="w-12 h-12 mx-auto mb-4 animate-pulse" style={{ color: 'var(--accent-blue)' }} />
          <div className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Multi-Agent Simulation Running
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            5 agents analyzing market data and generating forecasts...
          </div>
          <div className="mt-4 flex justify-center gap-3">
            {['Analyst', 'Economist', 'Pragmatist', 'Academic', 'Policymaker'].map((name, i) => (
              <div
                key={name}
                className="px-3 py-1.5 rounded-full text-xs font-medium animate-pulse"
                style={{
                  background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  color: '#93C5FD',
                  animationDelay: `${i * 0.2}s`,
                }}
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <SimulationResults result={result} expandedAgent={expandedAgent} setExpandedAgent={setExpandedAgent} />
      )}
    </div>
  )
}

function SimulationResults({
  result,
  expandedAgent,
  setExpandedAgent,
}: {
  result: SimulationResult
  expandedAgent: string | null
  setExpandedAgent: (a: string | null) => void
}) {
  return (
    <div className="space-y-4">
      {/* Aggregated Result */}
      <div className="glass-card p-6 glow-blue">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--accent-green)' }} />
          <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Simulation Complete</h3>
        </div>
        <div className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{result.question}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {result.outcomes.map((o, i) => (
            <div key={i} className="p-4 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
              <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{o.label}</div>
              <div className="text-3xl font-bold tabular-nums" style={{
                color: i === 0 ? 'var(--accent-blue)' : 'var(--text-secondary)',
              }}>
                {formatPrice(o.probability)}
              </div>
              <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-card)' }}>
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${o.probability * 100}%`,
                    background: i === 0 ? 'linear-gradient(90deg, #3B82F6, #8B5CF6)' : 'var(--text-muted)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Reasoning Traces */}
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          Agent Reasoning Traces (Chain-of-Draft)
        </h3>
        <div className="space-y-2">
          {result.agents.map(agent => (
            <AgentCard
              key={agent.role}
              agent={agent}
              expanded={expandedAgent === agent.role}
              onToggle={() => setExpandedAgent(expandedAgent === agent.role ? null : agent.role)}
            />
          ))}
        </div>
      </div>

      {/* Market Comparison Table */}
      {result.marketComparison.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            Simulation vs Market Comparison
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--text-muted)' }}>Source</th>
                  <th className="text-right py-2 px-3 font-medium" style={{ color: 'var(--text-muted)' }}>Probability</th>
                  <th className="text-right py-2 px-3 font-medium" style={{ color: 'var(--text-muted)' }}>Volume</th>
                  <th className="text-right py-2 px-3 font-medium" style={{ color: 'var(--text-muted)' }}>Gap</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td className="py-2 px-3 font-semibold" style={{ color: 'var(--accent-blue)' }}>
                    AI Simulation
                  </td>
                  <td className="py-2 px-3 text-right font-bold tabular-nums" style={{ color: 'var(--accent-blue)' }}>
                    {formatPrice(result.aggregatedProbability)}
                  </td>
                  <td className="py-2 px-3 text-right" style={{ color: 'var(--text-muted)' }}>—</td>
                  <td className="py-2 px-3 text-right" style={{ color: 'var(--text-muted)' }}>—</td>
                </tr>
                {result.marketComparison.map((mc, i) => {
                  const gap = Math.abs(result.aggregatedProbability - mc.probability)
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td className="py-2 px-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full badge-${mc.platform}`}>
                          {mc.platform.charAt(0).toUpperCase() + mc.platform.slice(1)}
                        </span>
                        <span className="ml-2 text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          {mc.marketTitle.slice(0, 40)}...
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                        {formatPrice(mc.probability)}
                      </td>
                      <td className="py-2 px-3 text-right" style={{ color: 'var(--text-secondary)' }}>
                        {formatVolume(mc.volume)}
                      </td>
                      <td className="py-2 px-3 text-right font-medium tabular-nums" style={{
                        color: gap < 0.05 ? 'var(--accent-green)' : gap < 0.15 ? 'var(--accent-orange)' : 'var(--accent-red)',
                      }}>
                        {(gap * 100).toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Moments Analysis */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          Distribution Moments Analysis
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Mean', value: result.moments.mean, fmt: formatPrice },
            { label: 'Variance', value: result.moments.variance, fmt: (v: number) => v.toFixed(4) },
            { label: 'Skewness', value: result.moments.skewness, fmt: (v: number) => v.toFixed(3) },
            { label: 'Kurtosis', value: result.moments.kurtosis, fmt: (v: number) => v.toFixed(3) },
          ].map(m => (
            <div key={m.label} className="p-3 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{m.label}</div>
              <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {m.fmt(m.value)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AgentCard({ agent, expanded, onToggle }: { agent: AgentVote; expanded: boolean; onToggle: () => void }) {
  return (
    <div className="glass-card-sm overflow-hidden">
      <button onClick={onToggle} className="w-full p-4 flex items-center gap-3 text-left agent-card-btn">
        <span className="text-2xl">{agent.avatar}</span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{agent.displayName}</div>
          <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{agent.rationale}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--accent-blue)' }}>
            {formatPrice(agent.finalProbability)}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            conf: {(agent.confidence * 100).toFixed(0)}%
          </div>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} /> : <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2" style={{ borderTop: '1px solid var(--glass-border)' }}>
          <div className="pt-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            Chain-of-Draft Reasoning
          </div>
          {agent.steps.map((step, i) => (
            <div key={i} className="flex gap-3 p-3 rounded-lg" style={{ background: 'var(--bg-primary)' }}>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                style={{ background: 'rgba(59,130,246,0.15)', color: '#93C5FD' }}
              >
                {step.step}
              </div>
              <div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{step.reasoning}</div>
                <div className="text-xs font-medium mt-1" style={{ color: 'var(--accent-cyan)' }}>{step.conclusion}</div>
              </div>
            </div>
          ))}
          {agent.citations.length > 0 && (
            <div className="pt-2">
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Data Sources</div>
              {agent.citations.map((c, i) => (
                <div key={i} className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
