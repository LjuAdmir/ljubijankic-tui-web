import type { Command } from '../types'

export default {
  name: 'ping',
  summary: 'Ping',
  hidden: true,
  run(_args, ctx) {
    ctx.print([{ text: `pong (${Math.ceil(Math.random() * 40)} ms)` }])
  },
} satisfies Command
