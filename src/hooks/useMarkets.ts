'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Market, Platform } from '@/lib/types'
import { fetchAllMarkets, FetchOptions } from '@/lib/api/unified'

interface UseMarketsReturn {
  markets: Market[]
  loading: boolean
  error: string | null
  refresh: () => void
  platformCounts: Record<Platform, number>
}

export function useMarkets(options?: FetchOptions): UseMarketsReturn {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const currentId = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAllMarkets(options)
      if (currentId === requestId.current) {
        setMarkets(data)
      }
    } catch (e) {
      if (currentId === requestId.current) {
        setError(e instanceof Error ? e.message : 'Failed to fetch markets')
      }
    } finally {
      if (currentId === requestId.current) {
        setLoading(false)
      }
    }
  }, [options?.platforms?.join(','), options?.category, options?.search, options?.sort, options?.limit])

  useEffect(() => { load() }, [load])

  const platformCounts: Record<Platform, number> = {
    polymarket: markets.filter(m => m.platform === 'polymarket').length,
    kalshi: markets.filter(m => m.platform === 'kalshi').length,
    opinion: markets.filter(m => m.platform === 'opinion').length,
  }

  return { markets, loading, error, refresh: load, platformCounts }
}
