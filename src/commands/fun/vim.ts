import type { Command } from '../types'

export default {
  name: 'vim',
  aliases: ['vi', 'nvim'],
  summary: 'Edit a file',
  usage: 'vim [file]',
  gag: true,
  run(_args, ctx) {
    ctx.print([{ text: "Opening vim... no, you'd never get out. (It's :q!, by the way.)" }])
  },
} satisfies Command
