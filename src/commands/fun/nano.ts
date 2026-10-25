import type { Command } from '../types'

export default {
  name: 'nano',
  summary: 'Edit a file',
  usage: 'nano [file]',
  gag: true,
  run(_args, ctx) {
    ctx.print([{ text: "nano: the sensible choice. Shame the file system's read-only." }])
  },
} satisfies Command
