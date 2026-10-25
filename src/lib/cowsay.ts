const cow = [
  '        \\   ^__^',
  '         \\  (oo)\\_______',
  '            (__)\\       )\\/\\',
  '                ||----w |',
  '                ||     ||',
]

// word-wraps like cowsay, splitting words longer than the bubble
function wrap(text: string, width: number): string[] {
  const lines: string[] = []
  let line = ''
  for (let word of text.split(/\s+/).filter(Boolean)) {
    while (word.length > width) {
      if (line) lines.push(line)
      lines.push(word.slice(0, width))
      word = word.slice(width)
      line = ''
    }
    if (line && line.length + word.length + 1 > width) {
      lines.push(line)
      line = word
    } else {
      line = line ? `${line} ${word}` : word
    }
  }
  if (line) lines.push(line)
  return lines
}

export function cowsay(text: string, width = 40): string[] {
  const lines = wrap(text, width)
  const longest = Math.max(...lines.map((line) => line.length))
  const borders = (index: number) => {
    if (lines.length === 1) return ['<', '>']
    if (index === 0) return ['/', '\\']
    if (index === lines.length - 1) return ['\\', '/']
    return ['|', '|']
  }

  return [
    ` ${'_'.repeat(longest + 2)}`,
    ...lines.map((line, index) => {
      const [left, right] = borders(index)
      return `${left} ${line.padEnd(longest)} ${right}`
    }),
    ` ${'-'.repeat(longest + 2)}`,
    ...cow,
  ]
}
