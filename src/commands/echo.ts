import type { Command } from './types'

export default {
  name: 'echo',
  summary: 'Print text',
  usage: 'echo <text>',
  run(args, ctx) {
    ctx.print([{ text: args.join(' ') }])
  },
} satisfies Command
