import { ref } from 'vue'
import { defineStore } from 'pinia'
import { parse } from '@/lib/parse'
import { findCommand } from '@/commands'
import type { CommandContext, Line } from '@/commands/types'

export type OutputEntry =
  | { id: number; kind: 'prompt'; cwd: string; input: string }
  | { id: number; kind: 'line'; line: Line }

export const useTerminalStore = defineStore('terminal', () => {
  const cwd = ref('~')
  const output = ref<OutputEntry[]>([])
  const mode = ref<'shell' | 'pager' | 'program'>('shell')
  let nextId = 0

  function print(...lines: Line[]) {
    for (const line of lines) output.value.push({ id: nextId++, kind: 'line', line })
  }

  function clear() {
    output.value = []
  }

  async function execute(input: string) {
    output.value.push({ id: nextId++, kind: 'prompt', cwd: cwd.value, input })

    const { name, args } = parse(input)
    if (!name) return

    const command = findCommand(name)
    if (!command) {
      print([{ text: `command not found: ${name}`, style: 'error' }])
      return
    }

    const ctx: CommandContext = { cwd: cwd.value, print, clear }
    await command.run(args, ctx)
  }

  return { cwd, output, mode, execute }
})
