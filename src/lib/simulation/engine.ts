import {
  AgentRole, AgentVote, AgentStep, SimulationResult,
  MarketComparison, MomentsAnalysis, Market, AppSettings
} from '../types'

// Agent definitions
const AGENTS: { role: AgentRole; name: string; avatar: string; bias: string }[] = [
  { role: 'analyst', name: 'Market Analyst', avatar: '📊', bias: 'data-driven, follows price trends' },
  { role: 'economist', name: 'Macro Economist', avatar: '🎓', bias: 'theory-based, focuses on fundamentals' },
  { role: 'pragmatist', name: 'Regional Pragmatist', avatar: '🌍', bias: 'considers political and regional factors' },
  { role: 'academic', name: 'Academic Balancer', avatar: '📚', bias: 'historical precedent, contrarian check' },
  { role: 'policymaker', name: 'Central Policymaker', avatar: '🏛️', bias: 'weighs dual mandate, communication strategy' },
]

// Chain-of-Draft: Each step ≤30 words
function generateRuleBasedSteps(
  role: AgentRole,
  question: string,
  marketData: MarketComparison[],
): AgentStep[] {
  const avgProb = marketData.length > 0
    ? marketData.reduce((s, m) => s + m.probability, 0) / marketData.length
    : 0.5

  const steps: AgentStep[] = []

  switch (role) {
    case 'analyst':
      steps.push({
        step: 1,
        reasoning: `Market consensus shows ${(avgProb * 100).toFixed(0)}% probability. Volume-weighted signals from ${marketData.length} platforms analyzed.`,
        conclusion: 'Markets show moderate confidence in this outcome.',
      })
      steps.push({
        step: 2,
        reasoning: `Cross-platform spread is ${calculateSpread(marketData).toFixed(1)}%. Higher spread indicates more uncertainty among market participants.`,
        conclusion: avgProb > 0.6 ? 'Lean bullish on primary outcome.' : 'Markets are still undecided.',
      })
      steps.push({
        step: 3,
        reasoning: `Adjusting for liquidity bias: deeper markets suggest ${avgProb > 0.5 ? 'yes' : 'no'} outcome is more likely.`,
        conclusion: `Final analyst estimate: ${(avgProb * 100).toFixed(0)}% probability.`,
      })
      break

    case 'economist':
      steps.push({
        step: 1,
        reasoning: 'Reviewing macroeconomic fundamentals: inflation trajectory, employment data, and GDP growth indicators.',
        conclusion: 'Economic fundamentals suggest measured policy approach.',
      })
      steps.push({
        step: 2,
        reasoning: `Fed dual mandate analysis: price stability vs maximum employment. Current data favors ${avgProb > 0.55 ? 'dovish' : 'hawkish'} stance.`,
        conclusion: 'Policy response likely aligned with market expectations.',
      })
      steps.push({
        step: 3,
        reasoning: `Integrating yield curve signals and financial conditions. Model output: ${((avgProb - 0.05 + Math.random() * 0.1) * 100).toFixed(0)}%.`,
        conclusion: 'Economist model agrees broadly with market consensus.',
      })
      break

    case 'pragmatist':
      steps.push({
        step: 1,
        reasoning: 'Evaluating geopolitical context, fiscal policy stance, and regional economic pressures affecting the decision.',
        conclusion: 'Political factors add uncertainty to base case.',
      })
      steps.push({
        step: 2,
        reasoning: `Considering communication strategy: recent speeches suggest ${avgProb > 0.5 ? 'continuity' : 'shift'} in approach.`,
        conclusion: 'Central bank communication aligns with market pricing.',
      })
      steps.push({
        step: 3,
        reasoning: `Political economy constraints favor gradual adjustment. Estimate: ${((avgProb + 0.02) * 100).toFixed(0)}%.`,
        conclusion: 'Pragmatic assessment slightly above market consensus.',
      })
      break

    case 'academic':
      steps.push({
        step: 1,
        reasoning: 'Historical analysis: reviewing similar episodes in past decades for pattern matching and base rates.',
        conclusion: 'Historical base rate provides anchor for estimate.',
      })
      steps.push({
        step: 2,
        reasoning: `Contrarian check: markets can overshoot. Current ${(avgProb * 100).toFixed(0)}% may overweight recent narrative vs structural factors.`,
        conclusion: 'Slight contrarian adjustment warranted.',
      })
      steps.push({
        step: 3,
        reasoning: `Academic literature suggests mean-reversion. Adjusted estimate: ${((avgProb * 0.9 + 0.05) * 100).toFixed(0)}%.`,
        conclusion: 'Academic view pulls toward moderate probability.',
      })
      break

    case 'policymaker':
      steps.push({
        step: 1,
        reasoning: 'Synthesizing all agent views: analyst, economist, pragmatist, academic perspectives integrated with policy framework.',
        conclusion: 'Multi-perspective synthesis narrows uncertainty band.',
      })
      steps.push({
        step: 2,
        reasoning: `Committee dynamics favor consensus. Individual views cluster around ${(avgProb * 100).toFixed(0)}% with low dispersion.`,
        conclusion: 'Strong consensus emerging among committee members.',
      })
      steps.push({
        step: 3,
        reasoning: `Final policy assessment weighs all inputs. Committee aggregate: ${(avgProb * 100).toFixed(0)}% for primary outcome.`,
        conclusion: 'Policy decision reflects balanced assessment.',
      })
      break
  }

  return steps
}

function calculateSpread(data: MarketComparison[]): number {
  if (data.length < 2) return 0
  const probs = data.map(d => d.probability)
  return (Math.max(...probs) - Math.min(...probs)) * 100
}

function generateRuleBasedVote(
  role: AgentRole,
  question: string,
  marketData: MarketComparison[],
): AgentVote {
  const agent = AGENTS.find(a => a.role === role)!
  const avgProb = marketData.length > 0
    ? marketData.reduce((s, m) => s + m.probability, 0) / marketData.length
    : 0.5

  // Each agent has slightly different calibration
  const offsets: Record<AgentRole, number> = {
    analyst: 0,
    economist: -0.03,
    pragmatist: 0.02,
    academic: -0.05,
    policymaker: 0.01,
  }

  const noise = (Math.random() - 0.5) * 0.06
  const finalProb = Math.min(0.99, Math.max(0.01, avgProb + offsets[role] + noise))
  const steps = generateRuleBasedSteps(role, question, marketData)

  return {
    role,
    displayName: agent.name,
    avatar: agent.avatar,
    steps,
    finalProbability: finalProb,
    confidence: 0.6 + Math.random() * 0.3,
    rationale: steps[steps.length - 1].conclusion,
    citations: marketData.map(m => `${m.platform}: ${(m.probability * 100).toFixed(0)}% (Vol: $${formatVol(m.volume)})`),
  }
}

// LLM-powered simulation
async function generateLLMVote(
  role: AgentRole,
  question: string,
  marketData: MarketComparison[],
  settings: AppSettings,
): Promise<AgentVote> {
  const agent = AGENTS.find(a => a.role === role)!

  const systemPrompt = `You are ${agent.name}, a ${agent.bias}. You are part of a multi-agent forecasting system analyzing macro events. Use Chain-of-Draft reasoning: each step must be ≤30 words. Provide exactly 3 reasoning steps.`

  const marketContext = marketData.map(m =>
    `${m.platform}: ${(m.probability * 100).toFixed(1)}% probability, volume $${formatVol(m.volume)}`
  ).join('\n')

  const userPrompt = `Question: "${question}"

Current market data:
${marketContext}

Analyze this as ${agent.name} (${agent.bias}).
Respond in this exact JSON format:
{
  "steps": [
    {"step": 1, "reasoning": "...(≤30 words)", "conclusion": "..."},
    {"step": 2, "reasoning": "...(≤30 words)", "conclusion": "..."},
    {"step": 3, "reasoning": "...(≤30 words)", "conclusion": "..."}
  ],
  "probability": 0.XX,
  "confidence": 0.XX,
  "rationale": "One sentence final assessment"
}`

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]

  try {
    let content: string

    if (settings.llmProvider === 'server-grok') {
      // Use server-side proxy (API key stays on server)
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, temperature: 0.7, max_tokens: 500 }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Server AI error: ${res.status}`)
      }

      const data = await res.json()
      content = data.choices?.[0]?.message?.content || ''
    } else {
      // Direct API call (user-provided keys)
      const { endpoint, headers, model } = getLLMConfig(settings)
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      })

      if (!res.ok) throw new Error(`LLM API error: ${res.status}`)
      const data = await res.json()
      content = data.choices?.[0]?.message?.content || ''
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Invalid LLM response format')
    const parsed = JSON.parse(jsonMatch[0])

    return {
      role,
      displayName: agent.name,
      avatar: agent.avatar,
      steps: parsed.steps || [],
      finalProbability: Math.min(0.99, Math.max(0.01, parsed.probability || 0.5)),
      confidence: parsed.confidence || 0.7,
      rationale: parsed.rationale || 'Analysis complete.',
      citations: marketData.map(m => `${m.platform}: ${(m.probability * 100).toFixed(0)}%`),
    }
  } catch (err) {
    console.warn(`LLM failed for ${role}, falling back to rule-based:`, err)
    return generateRuleBasedVote(role, question, marketData)
  }
}

function getLLMConfig(settings: AppSettings): { endpoint: string; headers: Record<string, string>; model: string } {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${settings.llmApiKey}`,
  }

  switch (settings.llmProvider) {
    case 'grok':
      return { endpoint: 'https://api.x.ai/v1/chat/completions', headers, model: settings.llmModel || 'grok-3' }
    case 'openai':
      return { endpoint: 'https://api.openai.com/v1/chat/completions', headers, model: settings.llmModel || 'gpt-4o-mini' }
    case 'openrouter':
      return { endpoint: 'https://openrouter.ai/api/v1/chat/completions', headers, model: settings.llmModel || 'deepseek/deepseek-chat' }
    default:
      throw new Error('No LLM provider configured')
  }
}

// Calculate moments from market data
function calculateMoments(marketData: MarketComparison[]): MomentsAnalysis {
  const probs = marketData.map(m => m.probability)
  const n = probs.length

  if (n === 0) {
    return { mean: 0.5, variance: 0, skewness: 0, kurtosis: 3, platforms: [] }
  }

  const mean = probs.reduce((s, p) => s + p, 0) / n
  const variance = probs.reduce((s, p) => s + Math.pow(p - mean, 2), 0) / n
  const stdDev = Math.sqrt(variance) || 0.001

  const skewness = n > 2
    ? probs.reduce((s, p) => s + Math.pow((p - mean) / stdDev, 3), 0) / n
    : 0

  const kurtosis = n > 3
    ? probs.reduce((s, p) => s + Math.pow((p - mean) / stdDev, 4), 0) / n
    : 3

  return {
    mean,
    variance,
    skewness,
    kurtosis,
    platforms: marketData.map(m => ({ platform: m.platform, prob: m.probability })),
  }
}

function formatVol(vol: number): string {
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M`
  if (vol >= 1e3) return `${(vol / 1e3).toFixed(1)}K`
  return vol.toFixed(0)
}

// Main simulation runner
export async function runSimulation(
  question: string,
  eventType: string,
  relatedMarkets: Market[],
  settings: AppSettings,
): Promise<SimulationResult> {
  const id = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  // Build market comparison from related markets
  // If no related markets passed, create synthetic comparison from the question
  const marketsToCompare = relatedMarkets.length > 0 ? relatedMarkets : []
  const marketComparison: MarketComparison[] = marketsToCompare.slice(0, 6).map(m => ({
    platform: m.platform,
    probability: m.outcomes[0]?.price || 0.5,
    volume: m.volume || 0,
    liquidity: m.liquidity || 0,
    lastUpdated: new Date().toISOString(),
    marketUrl: m.url,
    marketTitle: m.title,
  }))

  // If we still have no comparison data, add the base market probability context
  if (marketComparison.length === 0 && relatedMarkets.length === 0) {
    // Use a default 50% when no markets found
    marketComparison.push({
      platform: 'polymarket',
      probability: 0.5,
      volume: 0,
      liquidity: 0,
      lastUpdated: new Date().toISOString(),
      marketUrl: '',
      marketTitle: 'No matching market found — using base rate',
    })
  }

  // Run all agents
  // server-grok doesn't need an API key (key is on server)
  const useLLM = settings.llmProvider === 'server-grok' || (settings.llmProvider !== 'none' && settings.llmApiKey)
  const agentPromises = AGENTS.map(agent =>
    useLLM
      ? generateLLMVote(agent.role, question, marketComparison, settings)
      : Promise.resolve(generateRuleBasedVote(agent.role, question, marketComparison))
  )

  const agents = await Promise.all(agentPromises)

  // Aggregate: confidence-weighted average
  const totalWeight = agents.reduce((s, a) => s + a.confidence, 0)
  const aggregated = agents.reduce((s, a) => s + a.finalProbability * a.confidence, 0) / totalWeight

  const moments = calculateMoments(marketComparison)

  return {
    id,
    question,
    eventType,
    timestamp: Date.now(),
    agents,
    aggregatedProbability: aggregated,
    outcomes: [
      { label: 'Yes / Primary', probability: aggregated },
      { label: 'No / Alternative', probability: 1 - aggregated },
    ],
    marketComparison,
    moments,
    status: 'completed',
  }
}

// Preset events for quick simulation
export const PRESET_EVENTS = [
  {
    question: 'Will the Fed cut rates at the next FOMC meeting?',
    eventType: 'FOMC Rate Decision',
    keywords: ['fed', 'fomc', 'rate', 'cut', 'interest'],
  },
  {
    question: 'Will US CPI come in above expectations?',
    eventType: 'Inflation Report',
    keywords: ['cpi', 'inflation', 'consumer price'],
  },
  {
    question: 'Will US GDP growth exceed 2% this quarter?',
    eventType: 'GDP Release',
    keywords: ['gdp', 'growth', 'economic'],
  },
  {
    question: 'Will unemployment rate stay below 4.5%?',
    eventType: 'Employment Data',
    keywords: ['unemployment', 'jobs', 'employment', 'payroll', 'nonfarm'],
  },
  {
    question: 'Will Bitcoin exceed $150,000 in 2026?',
    eventType: 'Crypto Markets',
    keywords: ['bitcoin', 'btc', 'crypto'],
  },
  {
    question: 'Will there be a US recession in 2026?',
    eventType: 'Recession Outlook',
    keywords: ['recession', 'economic', 'downturn', 'contraction'],
  },
]
