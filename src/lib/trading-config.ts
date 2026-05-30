import { POLYMARKET_COLLATERAL_ASSET } from './api/polymarket-config'

export const REAL_TRADING_ENABLED = false as const
export const TRADING_MODE = 'read-only-forecaster' as const
export const DEFAULT_BUILDER_CODE = null

export type TradingSide = 'BUY' | 'SELL'

export interface NoopTradeRequest {
  tokenId: string
  side: TradingSide
  amountPusd: number
  price: number
  builderCode?: string | null
}

export class RealTradingDisabledError extends Error {
  readonly code = 'real_trading_disabled'

  constructor() {
    super('Real trading is disabled. REAL_TRADING_ENABLED defaults to false and this app does not post orders.')
    this.name = 'RealTradingDisabledError'
  }
}

export function getTradingRuntimeConfig() {
  return {
    realTradingEnabled: REAL_TRADING_ENABLED,
    mode: TRADING_MODE,
    collateralAsset: POLYMARKET_COLLATERAL_ASSET,
    builderCode: DEFAULT_BUILDER_CODE,
  }
}

export async function postRealOrderNoop(_request: NoopTradeRequest): Promise<never> {
  void _request
  throw new RealTradingDisabledError()
}
