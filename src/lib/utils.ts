import { Platform } from './types'
import { POLYMARKET_COLLATERAL_ASSET } from './api/polymarket-config'

export function formatVolume(vol: number): string {
  if (vol >= 1e9) return `${(vol / 1e9).toFixed(1)}B ${POLYMARKET_COLLATERAL_ASSET}`
  if (vol >= 1e6) return `${(vol / 1e6).toFixed(1)}M ${POLYMARKET_COLLATERAL_ASSET}`
  if (vol >= 1e3) return `${(vol / 1e3).toFixed(1)}K ${POLYMARKET_COLLATERAL_ASSET}`
  return `${vol.toFixed(0)} ${POLYMARKET_COLLATERAL_ASSET}`
}

export function formatPrice(price: number): string {
  return `${(price * 100).toFixed(1)}%`
}

export function formatPriceCents(price: number): string {
  return `${(price * 100).toFixed(0)}¢`
}

export function timeAgo(date: string | number): string {
  const now = Date.now()
  const then = typeof date === 'number' ? date : new Date(date).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(then).toLocaleDateString()
}

export function timeUntil(date: string): string {
  const now = Date.now()
  const target = new Date(date).getTime()
  const diff = target - now
  if (diff <= 0) return 'Ended'
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours}h left`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d left`
  const months = Math.floor(days / 30)
  return `${months}mo left`
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function platformColor(platform: Platform): string {
  const colors: Record<Platform, string> = {
    polymarket: '#3B82F6',
    kalshi: '#8B5CF6',
    opinion: '#EAB308',
  }
  return colors[platform]
}

export function platformBgClass(platform: Platform): string {
  const classes: Record<Platform, string> = {
    polymarket: 'badge-polymarket',
    kalshi: 'badge-kalshi',
    opinion: 'badge-opinion',
  }
  return classes[platform]
}
