import type { FileEntry } from '@/lib/fs'

type Style = 'dir' | 'file' | 'error' | 'muted' | 'accent'

export type Segment =
  | { text: string; style?: Style }
  | { text: string; command: string | string[]; href?: string; style?: Style }
  | { text: string; href: string }
  | { text: string; fill: string; style?: Style } // clickable, puts the text in the prompt

export type Line = Segment[]

// components are stored by name, so the output stays serialisable for the prerendered state
export type OutputComponent = 'lifefetch'

export interface CommandContext {
  cwd: string
  cd(path: string): void
  print(...lines: Line[]): void
  printComponent(name: OutputComponent): void
  open(file: FileEntry): void
  clear(): void
}

export interface Command {
  name: string
  aliases?: string[]
  summary: string
  usage?: string
  hidden?: boolean
  // candidates for the word being typed, paths by default
  complete?: (word: string, cwd: string) => string[]
  run: (args: string[], ctx: CommandContext) => void | Promise<void>
}
