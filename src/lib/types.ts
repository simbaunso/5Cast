export type Platform = 'polymarket' | 'kalshi' | 'opinion'

export interface Outcome {
  label: string
  price: number
  tokenId?: string
}

export interface Market {
  id: string
  platform: Platform
  title: string
  description?: string
  category?: string
  imageUrl?: string
  url: string
  outcomes: Outcome[]
  volume: number
  volume24h?: number
  liquidity?: number
  status: 'active' | 'closed' | 'resolved'
  createdAt?: string
  endDate?: string
  slug?: string
  extra?: Record<string, unknown>
}

export interface PriceHistory {
  timestamp: number
  price: number
}

export interface OrderBookEntry {
  price: number
  size: number
}

export interface OrderBook {
  bids: OrderBookEntry[]
  asks: OrderBookEntry[]
}

// Simulation Types
export type AgentRole = 'analyst' | 'economist' | 'pragmatist' | 'academic' | 'policymaker'

export interface AgentStep {
  step: number
  reasoning: string // ≤30 words Chain-of-Draft
  conclusion: string
}

export interface AgentVote {
  role: AgentRole
  displayName: string
  avatar: string
  steps: AgentStep[]
  finalProbability: number
  confidence: number
  rationale: string
  citations: string[]
}

export interface SimulationResult {
  id: string
  question: string
  eventType: string
  timestamp: number
  agents: AgentVote[]
  aggregatedProbability: number
  outcomes: { label: string; probability: number }[]
  marketComparison: MarketComparison[]
  moments: MomentsAnalysis
  status: 'running' | 'completed' | 'error'
}

export interface MarketComparison {
  platform: Platform
  probability: number
  volume: number
  liquidity: number
  lastUpdated: string
  marketUrl: string
  marketTitle: string
}

export interface MomentsAnalysis {
  mean: number
  variance: number
  skewness: number
  kurtosis: number
  platforms: { platform: string; prob: number }[]
}

// Leaderboard
export interface LeaderboardEntry {
  id: string
  question: string
  simulationProb: number
  actualOutcome?: number
  marketAvgProb: number
  gap: number
  accuracy?: number
  timestamp: number
  votes: number
}

// Settings
export interface AppSettings {
  llmProvider: 'server-grok' | 'grok' | 'openai' | 'openrouter' | 'none'
  llmApiKey: string
  llmModel: string
  opinionApiKey: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  llmProvider: 'server-grok',
  llmApiKey: '',
  llmModel: '',
  opinionApiKey: '',
}

export const PLATFORM_COLORS: Record<Platform, string> = {
  polymarket: '#3B82F6',
  kalshi: '#8B5CF6',
  opinion: '#EAB308',
}

export const PLATFORM_NAMES: Record<Platform, string> = {
  polymarket: 'Polymarket',
  kalshi: 'Kalshi',
  opinion: 'Opinion',
}
