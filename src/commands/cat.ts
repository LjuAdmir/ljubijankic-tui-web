import { resolve } from '@/lib/fs'
import type { Command } from './types'

export default {
  name: 'cat',
  aliases: ['open', 'less'],
  summary: 'Open a file',
  usage: 'cat <file>',
  run([path], ctx) {
    if (!path) {
      ctx.print(
        [{ text: 'cat: missing file', style: 'error' }],
        [{ text: 'usage: cat <file>', style: 'muted' }],
      )
      return
    }

    const entry = resolve(path, ctx.cwd)
    if (entry?.kind === 'file') return ctx.open(entry)
    const reason = entry ? 'is a directory' : 'no such file'
    ctx.print([{ text: `cat: ${path}: ${reason}`, style: 'error' }])
  },
} satisfies Command
