import { resolve } from '@/lib/fs'
import { goHome } from './lifefetch'
import type { Command } from './types'

export default {
  name: 'cd',
  summary: 'Change directory',
  usage: 'cd [path]',
  run([path = '~'], ctx) {
    if (path === '~' || path === '$HOME') return goHome(ctx)
    if (path === '-') return ctx.cd('-')

    const entry = resolve(path, ctx.cwd)
    if (entry?.kind === 'dir') return ctx.cd(entry.path)

    const reason = entry ? 'not a directory' : 'no such directory'
    ctx.print([{ text: `cd: ${reason}: ${path}`, style: 'error' }])
  },
} satisfies Command
