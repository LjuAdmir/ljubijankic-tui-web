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
