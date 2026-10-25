import { prefersReducedMotion } from '@/lib/motion'
import type { Command } from '../types'

export default {
  name: 'matrix',
  summary: 'Digital rain, any key stops it',
  aliases: ['cmatrix'],
  run(_args, ctx) {
    if (prefersReducedMotion()) {
      ctx.print([{ text: 'matrix: the rain is holding off today (reduce motion is on).' }])
      return
    }
    ctx.startProgram('matrix')
  },
} satisfies Command
