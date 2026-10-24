import { ref } from 'vue'
import { defineStore } from 'pinia'
import { parse } from '@/lib/parse'
import { findCommand } from '@/commands'
import type { FileEntry } from '@/lib/fs'
import type { CommandContext, Line } from '@/commands/types'

export type OutputEntry =
  | { id: number; kind: 'prompt'; cwd: string; input: string }
  | { id: number; kind: 'line'; line: Line }

export const useTerminalStore = defineStore('terminal', () => {
  const cwd = ref('~')
  const previousCwd = ref('~')
  const output = ref<OutputEntry[]>([])
  const mode = ref<'shell' | 'pager' | 'program'>('shell')
  const openFile = ref<FileEntry | null>(null)

  // derived from the output rather than a counter, so it survives the prerendered state handover
  const nextId = () => (output.value.at(-1)?.id ?? -1) + 1

  function print(...lines: Line[]) {
    for (const line of lines) output.value.push({ id: nextId(), kind: 'line', line })
  }

  function clear() {
    output.value = []
  }

  function cd(path: string) {
    const target = path === '-' ? previousCwd.value : path
    previousCwd.value = cwd.value
    cwd.value = target
  }

  function open(file: FileEntry) {
    openFile.value = file
    mode.value = 'pager'
  }

  function closeFile() {
    openFile.value = null
    mode.value = 'shell'
  }

  async function execute(input: string | string[]) {
    for (const line of [input].flat()) await run(line)
  }

  async function run(input: string) {
    output.value.push({ id: nextId(), kind: 'prompt', cwd: cwd.value, input })

    const { name, args } = parse(input)
    if (!name) return

    const command = findCommand(name)
    if (!command) {
      print([{ text: `command not found: ${name}`, style: 'error' }])
      return
    }

    const ctx: CommandContext = { cwd: cwd.value, cd, print, open, clear }
    await command.run(args, ctx)
  }

  return { cwd, previousCwd, output, mode, openFile, execute, print, clear, closeFile }
})
