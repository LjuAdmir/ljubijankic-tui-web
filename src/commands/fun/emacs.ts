import type { Command } from '../types'

export default {
  name: 'emacs',
  summary: 'Edit a file',
  usage: 'emacs [file]',
  gag: true,
  run(_args, ctx) {
    ctx.print([{ text: 'emacs: a great operating system, lacking only a decent editor.' }])
  },
} satisfies Command
