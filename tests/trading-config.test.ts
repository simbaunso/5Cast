import { describe, expect, it } from 'vitest'
import {
  REAL_TRADING_ENABLED,
  RealTradingDisabledError,
  getTradingRuntimeConfig,
  postRealOrderNoop,
} from '../src/lib/trading-config'

describe('trading guard', () => {
  it('keeps real trading disabled by default', () => {
    const config = getTradingRuntimeConfig()

    expect(REAL_TRADING_ENABLED).toBe(false)
    expect(config.realTradingEnabled).toBe(false)
    expect(config.collateralAsset).toBe('pUSD')
    expect(config.builderCode).toBeNull()
  })

  it('rejects future money path calls while disabled', async () => {
    await expect(postRealOrderNoop({
      tokenId: 'token-1',
      side: 'BUY',
      amountPusd: 25,
      price: 0.52,
    })).rejects.toBeInstanceOf(RealTradingDisabledError)
  })
})
