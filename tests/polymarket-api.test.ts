import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchPolymarketMarkets } from '../src/lib/api/polymarket'

describe('polymarket market fetch', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('fetches Gamma events through the v2 read-only proxy helper', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify([
        {
          id: 'event-1',
          title: 'Will rates fall?',
          description: 'Macro event',
          image: 'https://example.com/image.png',
          slug: 'will-rates-fall',
          volume: 1250000,
          volume24hr: 12000,
          liquidity: 50000,
          startDate: '2026-01-01T00:00:00Z',
          endDate: '2026-12-31T00:00:00Z',
          markets: [{
            outcomes: '["Yes","No"]',
            outcomePrices: '["0.55","0.45"]',
            clobTokenIds: '["yes-token","no-token"]',
            conditionId: 'condition-1',
            tags: [{ slug: 'economics' }],
          }],
        },
      ]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
    vi.stubGlobal('fetch', fetchMock)

    const markets = await fetchPolymarketMarkets(10)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/proxy/poly/gamma/events?active=true&closed=false&limit=10&offset=0&order=volume24hr&ascending=false')
    expect(markets).toHaveLength(1)
    expect(markets[0]).toMatchObject({
      id: 'event-1',
      platform: 'polymarket',
      volume: 1250000,
      collateralAsset: 'pUSD',
    })
    expect(markets[0]?.outcomes[0]).toMatchObject({ label: 'Yes', price: 0.55, tokenId: 'yes-token' })
  })

  it('aborts slow Polymarket reads', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn<typeof fetch>((_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    }))
    vi.stubGlobal('fetch', fetchMock)

    const marketsPromise = fetchPolymarketMarkets(5)
    const rejection = expect(marketsPromise).rejects.toMatchObject({ name: 'AbortError' })
    await vi.advanceTimersByTimeAsync(10_000)

    await rejection
  })
})
