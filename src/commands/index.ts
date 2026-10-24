import type { Command } from './types'

const commands: Command[] = []

export function allCommands(): Command[] {
  return commands
}

export function findCommand(name: string): Command | undefined {
  return commands.find((command) => command.name === name || command.aliases?.includes(name))
}
