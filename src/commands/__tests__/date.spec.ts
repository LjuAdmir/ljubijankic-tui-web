import { describe, expect, it } from 'vitest'
import { formatDate } from '../date'

describe('formatDate', () => {
  it('prints like GNU date', () => {
    expect(formatDate(new Date(2026, 9, 25, 14, 3, 12))).toMatch(/^Sun Oct 25 14:03:12 \S+ 2026$/)
  })

  it('pads the day with a space and the time with zeros', () => {
    expect(formatDate(new Date(2026, 8, 5, 7, 4, 9))).toMatch(/^Sat Sep {2}5 07:04:09 \S+ 2026$/)
  })
})
