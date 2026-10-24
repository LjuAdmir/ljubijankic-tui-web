import type { Command } from './types'

export default {
  name: 'pwd',
  summary: 'Print the current directory',
  run(_args, ctx) {
    ctx.print([{ text: ctx.cwd }])
  },
} satisfies Command
