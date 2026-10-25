import type { Command } from '../types'

export default {
  name: 'cowsay',
  summary: 'Let a cow say something',
  usage: 'cowsay <text>',
  run(args, ctx) {
    ctx.printComponent('cowsay', { text: args.join(' ') || 'Moo.' })
  },
} satisfies Command
