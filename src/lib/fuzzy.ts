// edits needed to turn one word into the other, swapping two neighbouring letters counts as one
export function distance(a: string, b: string): number {
  let before: number[] = []
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let edits = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        edits = Math.min(edits, before[j - 2]! + 1)
      }
      current.push(edits)
    }
    ;[before, previous] = [previous, current]
  }
  return previous[b.length]!
}

// the candidate a typo most likely meant: one edit away for short words, two for longer ones.
// On a tie the earlier candidate wins.
export function closest(query: string, candidates: string[]): string | undefined {
  const limit = query.length <= 4 ? 1 : 2
  let best: string | undefined
  let bestDistance = limit + 1
  for (const candidate of candidates) {
    const d = distance(query, candidate)
    if (d < bestDistance) {
      best = candidate
      bestDistance = d
    }
  }
  return best
}

export interface Match {
  score: number
  positions: number[]
}

// the query's letters in order, ignoring case. Runs of letters and word starts score higher.
export function match(query: string, text: string): Match | null {
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  if (!q) return { score: 0, positions: [] }

  let best: Match | null = null
  // try from every place the first letter appears, `proj` should find `projects` and not the p in `open`
  for (let start = t.indexOf(q[0]!); start !== -1; start = t.indexOf(q[0]!, start + 1)) {
    const positions = [start]
    for (const char of q.slice(1)) {
      const next = t.indexOf(char, positions.at(-1)! + 1)
      if (next === -1) return best
      positions.push(next)
    }
    const score = positions.reduce((sum, position, i) => {
      const run = i > 0 && position === positions[i - 1]! + 1
      const wordStart = position === 0 || /[\s/._-]/.test(t[position - 1]!)
      return sum + 1 + (run ? 3 : 0) + (wordStart ? 2 : 0)
    }, 0)
    if (!best || score > best.score) best = { score, positions }
  }
  return best
}
