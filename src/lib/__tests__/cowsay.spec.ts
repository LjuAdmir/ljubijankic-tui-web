import { describe, expect, it } from 'vitest'
import { cowsay } from '../cowsay'

describe('cowsay', () => {
  it('uses angle brackets for one line', () => {
    expect(cowsay('Moo.').slice(0, 3)).toEqual([' ______', '< Moo. >', ' ------'])
  })

  it('wraps at 40 columns with a rounded bubble', () => {
    const bubble = cowsay('word '.repeat(20)).slice(1, 4)
    expect(bubble).toEqual([
      `/ ${'word '.repeat(8).trim()} \\`,
      `| ${'word '.repeat(8).trim()} |`,
      `\\ ${'word '.repeat(4).trim().padEnd(39)} /`,
    ])
  })

  it('wraps narrower when asked', () => {
    expect(cowsay('the quick brown fox', 10).slice(1, 3)).toEqual([
      '/ the quick \\',
      '\\ brown fox /',
    ])
  })

  it('splits words longer than the bubble', () => {
    expect(cowsay('x'.repeat(45)).slice(1, 3)).toEqual([
      `/ ${'x'.repeat(40)} \\`,
      `\\ ${'x'.repeat(5).padEnd(40)} /`,
    ])
  })
})
