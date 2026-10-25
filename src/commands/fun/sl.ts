import { prefersReducedMotion } from '@/lib/motion'
import type { Command } from '../types'

export default {
  name: 'sl',
  summary: 'Steam locomotive',
  hidden: true,
  run(_args, ctx) {
    if (prefersReducedMotion()) {
      ctx.print([{ text: 'sl: the train is staying in the depot (reduce motion is on).' }])
      return
    }
    ctx.startProgram('sl')
  },
} satisfies Command
