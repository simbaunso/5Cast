export const POLYMARKET_GAMMA_HOST = 'https://gamma-api.polymarket.com'
export const POLYMARKET_DATA_HOST = 'https://data-api.polymarket.com'
export const POLYMARKET_CLOB_HOST = 'https://clob.polymarket.com'

export const POLYMARKET_GAMMA_PROXY_PREFIX = '/proxy/poly/gamma'
export const POLYMARKET_DATA_PROXY_PREFIX = '/proxy/poly/data'
export const POLYMARKET_CLOB_PROXY_PREFIX = '/proxy/poly/clob'

export const POLYMARKET_COLLATERAL_ASSET = 'pUSD' as const
export type PolymarketCollateralAsset = typeof POLYMARKET_COLLATERAL_ASSET

export const POLYMARKET_GAMMA_ENDPOINTS = ['events', 'markets'] as const
export const POLYMARKET_DATA_ENDPOINTS = ['trades', 'positions', 'closed-positions'] as const
export const POLYMARKET_CLOB_ENDPOINTS = [
  'price',
  'prices',
  'prices-history',
  'book',
  'books',
  'midpoint',
  'midpoints',
] as const

export const POLYMARKET_READ_ONLY_ENDPOINTS = [
  ...POLYMARKET_GAMMA_ENDPOINTS,
  ...POLYMARKET_DATA_ENDPOINTS,
  ...POLYMARKET_CLOB_ENDPOINTS,
] as const

export const POLYMARKET_REQUEST_TIMEOUT_MS = 10_000

export function isAllowedPolymarketReadEndpoint(endpoint: string): boolean {
  return POLYMARKET_READ_ONLY_ENDPOINTS.some(
    allowed => endpoint === allowed || endpoint.startsWith(`${allowed}/`)
  )
}

export function resolvePolymarketHost(endpoint: string): string {
  if (POLYMARKET_DATA_ENDPOINTS.some(allowed => endpoint === allowed || endpoint.startsWith(`${allowed}/`))) {
    return POLYMARKET_DATA_HOST
  }

  if (POLYMARKET_CLOB_ENDPOINTS.some(allowed => endpoint === allowed || endpoint.startsWith(`${allowed}/`))) {
    return POLYMARKET_CLOB_HOST
  }

  return POLYMARKET_GAMMA_HOST
}

export function resolvePolymarketProxyPrefix(endpoint: string): string {
  if (POLYMARKET_DATA_ENDPOINTS.some(allowed => endpoint === allowed || endpoint.startsWith(`${allowed}/`))) {
    return POLYMARKET_DATA_PROXY_PREFIX
  }

  if (POLYMARKET_CLOB_ENDPOINTS.some(allowed => endpoint === allowed || endpoint.startsWith(`${allowed}/`))) {
    return POLYMARKET_CLOB_PROXY_PREFIX
  }

  return POLYMARKET_GAMMA_PROXY_PREFIX
}

export function normalizePolymarketQuery(endpoint: string, params: URLSearchParams): URLSearchParams {
  const normalized = new URLSearchParams(params)

  if (endpoint === 'prices-history' && normalized.has('token_id') && !normalized.has('market')) {
    const tokenId = normalized.get('token_id')
    normalized.delete('token_id')
    if (tokenId) normalized.set('market', tokenId)
  }

  return normalized
}

export function buildPolymarketProxyUrl(endpoint: string, params = new URLSearchParams()): string {
  if (endpoint.includes('..') || !isAllowedPolymarketReadEndpoint(endpoint)) {
    throw new Error(`Invalid Polymarket read endpoint: ${endpoint}`)
  }

  const query = normalizePolymarketQuery(endpoint, params).toString()
  return `${resolvePolymarketProxyPrefix(endpoint)}/${endpoint}${query ? `?${query}` : ''}`
}

export async function fetchPolymarketReadEndpoint<T>(
  endpoint: string,
  params = new URLSearchParams(),
  init: RequestInit = {}
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), POLYMARKET_REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(buildPolymarketProxyUrl(endpoint, params), {
      ...init,
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`Polymarket API error: ${res.status}`)
    return await res.json() as T
  } finally {
    clearTimeout(timeoutId)
  }
}
