import type { Command } from './types'

export default {
  name: 'clear',
  summary: 'Clear the screen',
  run(_args, ctx) {
    ctx.clear()
  },
} satisfies Command
