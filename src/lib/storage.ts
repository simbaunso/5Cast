import { SimulationResult, LeaderboardEntry, AppSettings, DEFAULT_SETTINGS } from './types'

const STORAGE_KEYS = {
  simulations: 'macroforecaster_simulations',
  leaderboard: 'macroforecaster_leaderboard',
  settings: 'macroforecaster_settings',
}

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function setItem(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage full or unavailable
  }
}

// Simulations
export function getSavedSimulations(): SimulationResult[] {
  return getItem<SimulationResult[]>(STORAGE_KEYS.simulations, [])
}

export function saveSimulation(sim: SimulationResult): void {
  const sims = getSavedSimulations()
  sims.unshift(sim)
  // Keep last 50 simulations
  setItem(STORAGE_KEYS.simulations, sims.slice(0, 50))
}

export function deleteSimulation(id: string): void {
  const sims = getSavedSimulations().filter(s => s.id !== id)
  setItem(STORAGE_KEYS.simulations, sims)
}

// Leaderboard
export function getLeaderboard(): LeaderboardEntry[] {
  return getItem<LeaderboardEntry[]>(STORAGE_KEYS.leaderboard, [])
}

export function addToLeaderboard(entry: LeaderboardEntry): void {
  const board = getLeaderboard()
  board.push(entry)
  board.sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0))
  setItem(STORAGE_KEYS.leaderboard, board.slice(0, 100))
}

export function voteLeaderboardEntry(id: string): void {
  const board = getLeaderboard()
  const entry = board.find(e => e.id === id)
  if (entry) {
    entry.votes = (entry.votes || 0) + 1
    setItem(STORAGE_KEYS.leaderboard, board)
  }
}

// Settings
export function getSettings(): AppSettings {
  return getItem<AppSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS)
}

export function saveSettings(settings: AppSettings): void {
  setItem(STORAGE_KEYS.settings, settings)
}
