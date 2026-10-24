import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { load, save } from '../storage'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('storage', () => {
  it('round-trips values as JSON', () => {
    save('key', ['ls', 'cd projects'])
    expect(load('key', [])).toEqual(['ls', 'cd projects'])
  })

  it('falls back when nothing is stored', () => {
    expect(load('missing', 'fallback')).toBe('fallback')
  })

  it('falls back on invalid JSON', () => {
    localStorage.setItem('key', '{nope')
    expect(load('key', [])).toEqual([])
  })

  it('keeps working when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    expect(load('key', [])).toEqual([])
    expect(() => save('key', [])).not.toThrow()
  })
})
