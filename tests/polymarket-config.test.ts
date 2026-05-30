import { describe, expect, it } from 'vitest'
import {
  POLYMARKET_CLOB_HOST,
  POLYMARKET_COLLATERAL_ASSET,
  POLYMARKET_DATA_HOST,
  POLYMARKET_GAMMA_HOST,
  buildPolymarketProxyUrl,
  isAllowedPolymarketReadEndpoint,
  normalizePolymarketQuery,
  resolvePolymarketHost,
} from '../src/lib/api/polymarket-config'

describe('polymarket read-only config', () => {
  it('routes current public endpoints to v2 hosts', () => {
    expect(resolvePolymarketHost('events')).toBe(POLYMARKET_GAMMA_HOST)
    expect(resolvePolymarketHost('markets')).toBe(POLYMARKET_GAMMA_HOST)
    expect(resolvePolymarketHost('trades')).toBe(POLYMARKET_DATA_HOST)
    expect(resolvePolymarketHost('positions')).toBe(POLYMARKET_DATA_HOST)
    expect(resolvePolymarketHost('price')).toBe(POLYMARKET_CLOB_HOST)
    expect(resolvePolymarketHost('prices-history')).toBe(POLYMARKET_CLOB_HOST)
    expect(resolvePolymarketHost('book')).toBe(POLYMARKET_CLOB_HOST)
  })

  it('keeps trading and auth endpoints outside the read-only helper', () => {
    expect(isAllowedPolymarketReadEndpoint('order')).toBe(false)
    expect(isAllowedPolymarketReadEndpoint('orders')).toBe(false)
    expect(isAllowedPolymarketReadEndpoint('auth/api-key')).toBe(false)
    expect(() => buildPolymarketProxyUrl('order')).toThrow(/Invalid Polymarket/)
  })

  it('builds proxy URLs and normalizes v2 prices-history parameters', () => {
    const params = normalizePolymarketQuery('prices-history', new URLSearchParams('token_id=asset-1&fidelity=60'))

    expect(params.get('token_id')).toBeNull()
    expect(params.get('market')).toBe('asset-1')
    expect(buildPolymarketProxyUrl('prices-history', params)).toBe('/proxy/poly/clob/prices-history?fidelity=60&market=asset-1')
    expect(buildPolymarketProxyUrl('events', new URLSearchParams('limit=10'))).toBe('/proxy/poly/gamma/events?limit=10')
    expect(POLYMARKET_COLLATERAL_ASSET).toBe('pUSD')
  })
})
