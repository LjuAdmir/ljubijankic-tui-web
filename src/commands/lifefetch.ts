import type { Command, CommandContext } from './types'

export function goHome(ctx: CommandContext) {
  ctx.clear()
  ctx.cd('~')
  ctx.printComponent('lifefetch')
}

export default {
  name: 'lifefetch',
  aliases: ['neofetch', 'fastfetch'],
  summary: 'Show the home screen',
  run(_args, ctx) {
    goHome(ctx)
  },
} satisfies Command
