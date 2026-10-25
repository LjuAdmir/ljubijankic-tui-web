import { list, root, type Entry } from '@/lib/fs'
import { hasFlag } from '@/lib/parse'
import { prefersReducedMotion } from '@/lib/motion'
import type { Command, Line } from '../types'

const targets = ['/', '~', '*']

// like rm -v: a directory's contents before the directory itself
function removed(entry: Entry): string[] {
  if (entry.kind === 'file') return [`removed '${entry.path}'`]
  return [...list(entry, { all: true }).flatMap(removed), `removed directory '${entry.path}'`]
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default {
  name: 'rm',
  summary: 'Remove files',
  usage: 'rm [-rf] <path>',
  gag: true,
  async run(args, ctx) {
    const paths = args.filter((arg) => !arg.startsWith('-'))
    if (!paths.length) return ctx.print([{ text: 'rm: missing operand', style: 'error' }])

    const meltdown =
      hasFlag(args, 'r', 'recursive') &&
      hasFlag(args, 'f', 'force') &&
      paths.some((path) => targets.includes(path))
    if (!meltdown) {
      ctx.print(
        ...paths.map((path): Line => [
          { text: `rm: cannot remove '${path}': Read-only file system`, style: 'error' },
        ]),
      )
      return
    }

    const instant = prefersReducedMotion()
    for (const line of list(root, { all: true }).flatMap(removed)) {
      ctx.print([{ text: line }])
      if (!instant) await sleep(80)
    }
    await ctx.glitch()
    ctx.print([], [{ text: "Just kidding. Everything's still here." }])
  },
} satisfies Command
