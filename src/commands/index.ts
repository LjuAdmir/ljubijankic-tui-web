import type { Command } from './types'
import clear from './clear'
import echo from './echo'
import help from './help'

const commands: Command[] = [clear, echo, help]

export function allCommands(): Command[] {
  return commands
}

export function findCommand(name: string): Command | undefined {
  return commands.find((command) => command.name === name || command.aliases?.includes(name))
}
