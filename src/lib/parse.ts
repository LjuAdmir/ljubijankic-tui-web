export interface ParsedInput {
  name: string
  args: string[]
}

export function tokenize(input: string): string[] {
  const tokens: string[] = []
  let current = ''
  let quote: '"' | "'" | null = null
  let inToken = false

  for (const char of input) {
    if (quote) {
      if (char === quote) quote = null
      else current += char
    } else if (char === '"' || char === "'") {
      quote = char
      inToken = true
    } else if (/\s/.test(char)) {
      if (inToken) tokens.push(current)
      current = ''
      inToken = false
    } else {
      current += char
      inToken = true
    }
  }

  if (inToken) tokens.push(current)
  return tokens
}

export function parse(input: string): ParsedInput {
  const [name = '', ...args] = tokenize(input)
  return { name, args }
}

export function hasFlag(args: string[], short: string, long: string): boolean {
  return args.some((arg) => arg === `--${long}` || (/^-[^-]/.test(arg) && arg.includes(short)))
}
