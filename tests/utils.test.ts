import { describe, expect, it } from 'vitest'
import { formatVolume } from '../src/lib/utils'

describe('formatVolume', () => {
  it('uses pUSD wording for visible market volume', () => {
    expect(formatVolume(1_250_000)).toBe('1.3M pUSD')
    expect(formatVolume(900)).toBe('900 pUSD')
  })
})
