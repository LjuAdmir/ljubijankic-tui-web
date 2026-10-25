import { list, resolve, type DirEntry, type Entry } from '@/lib/fs'
import { hasFlag } from '@/lib/parse'
import { paths } from '@/lib/complete'
import { entrySegment } from './segments'
import type { Command, Line } from './types'

interface Row {
  prefix: string
  entry: Entry
  label: string
}

function walk(dir: DirEntry, all: boolean, prefix = ''): Row[] {
  const entries = list(dir, { all })
  return entries.flatMap((entry, index) => {
    const last = index === entries.length - 1
    const label = entry.kind === 'dir' ? `${entry.name}/` : entry.name
    const row = { prefix: prefix + (last ? '└── ' : '├── '), entry, label }
    if (entry.kind === 'file') return [row]
    return [row, ...walk(entry, all, prefix + (last ? '    ' : '│   '))]
  })
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`
}

export default {
  name: 'tree',
  summary: 'Show a directory as a tree',
  usage: 'tree [-a] [path]',
  complete: (word, cwd) => paths(word, cwd, { dirs: true }),
  run(args, ctx) {
    const path = args.find((arg) => !arg.startsWith('-')) ?? '.'
    const target = resolve(path, ctx.cwd)
    if (target?.kind !== 'dir') {
      const reason = target ? 'not a directory' : 'no such directory'
      ctx.print([{ text: `tree: ${reason}: ${path}`, style: 'error' }])
      return
    }

    const rows = walk(target, hasFlag(args, 'a', 'all'))
    const width = Math.max(...rows.map((row) => row.prefix.length + row.label.length))
    const dirs = rows.filter((row) => row.entry.kind === 'dir').length

    ctx.print(
      [entrySegment(target, target.path)],
      ...rows.map(({ prefix, entry, label }): Line => {
        const description = entry.meta.description
        const padding = description ? ' '.repeat(width - prefix.length - label.length + 2) : ''
        return [
          { text: prefix, style: 'muted', decorative: true },
          entrySegment(entry, label),
          { text: padding },
          { text: description ?? '', style: 'muted', hang: true },
        ]
      }),
      [],
      [
        {
          text: `${plural(dirs, 'directory', 'directories')}, ${plural(rows.length - dirs, 'file', 'files')}`,
          style: 'muted',
        },
      ],
    )
  },
} satisfies Command
