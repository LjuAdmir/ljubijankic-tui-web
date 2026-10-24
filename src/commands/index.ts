import { closest } from '@/lib/fuzzy'
import { matching, paths } from '@/lib/complete'
import type { Command } from './types'
import cat from './cat'
import cd from './cd'
import clear from './clear'
import echo from './echo'
import help from './help'
import history from './history'
import lifefetch from './lifefetch'
import ls from './ls'
import pwd from './pwd'
import share from './share'
import tree from './tree'

const commands: Command[] = [cat, cd, clear, echo, help, history, lifefetch, ls, pwd, share, tree]

export function allCommands(): Command[] {
  return commands
}

export function findCommand(name: string): Command | undefined {
  return commands.find((command) => command.name === name || command.aliases?.includes(name))
}

// hidden commands are never suggested or completed, so they don't give the easter eggs away
const visible = () => commands.filter((command) => !command.hidden)

export function commandNames(): string[] {
  return visible().flatMap((command) => [command.name, ...(command.aliases ?? [])])
}

export function suggestCommand(name: string): string | undefined {
  // main names win ties over aliases, so `lss` suggests ls rather than less
  const names = visible()
    .map((command) => command.name)
    .sort()
  const aliases = visible()
    .flatMap((command) => command.aliases ?? [])
    .sort()
  return closest(name, [...names, ...aliases])
}

// candidates for the last word of the input: a command name first, then whatever the command takes
export function completeInput(input: string, cwd: string) {
  const start = input.lastIndexOf(' ') + 1
  const word = input.slice(start)
  const [name] = input.slice(0, start).trim().split(/\s+/)
  if (!name) return { start, candidates: matching(word, commandNames()) }
  const command = findCommand(name)
  return { start, candidates: command?.complete?.(word, cwd) ?? paths(word, cwd) }
}
