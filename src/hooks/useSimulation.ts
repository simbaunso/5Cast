'use client'

import { useState, useCallback } from 'react'
import { SimulationResult, Market, AppSettings } from '@/lib/types'
import { runSimulation } from '@/lib/simulation/engine'
import { saveSimulation, getSavedSimulations } from '@/lib/storage'

interface UseSimulationReturn {
  result: SimulationResult | null
  running: boolean
  error: string | null
  history: SimulationResult[]
  run: (question: string, eventType: string, markets: Market[], settings: AppSettings) => Promise<void>
  loadHistory: () => void
}

export function useSimulation(): UseSimulationReturn {
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<SimulationResult[]>([])

  const run = useCallback(async (
    question: string,
    eventType: string,
    markets: Market[],
    settings: AppSettings,
  ) => {
    setRunning(true)
    setError(null)
    setResult(null)

    try {
      const sim = await runSimulation(question, eventType, markets, settings)
      setResult(sim)
      saveSimulation(sim)
      setHistory(prev => [sim, ...prev])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Simulation failed')
    } finally {
      setRunning(false)
    }
  }, [])

  const loadHistory = useCallback(() => {
    setHistory(getSavedSimulations())
  }, [])

  return { result, running, error, history, run, loadHistory }
}
