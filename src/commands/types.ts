export type Segment =
  | { text: string; style?: 'dir' | 'file' | 'error' | 'muted' | 'accent' }
  | { text: string; command: string }
  | { text: string; href: string }

export type Line = Segment[]

export interface CommandContext {
  cwd: string
  print(...lines: Line[]): void
  clear(): void
}

export interface Command {
  name: string
  aliases?: string[]
  summary: string
  usage?: string
  hidden?: boolean
  run: (args: string[], ctx: CommandContext) => void | Promise<void>
}
