// storage can be blocked (private mode, disabled cookies), the site works without it

export function load<T>(key: string, fallback: T): T {
  if (import.meta.env.SSR) return fallback
  try {
    const value = localStorage.getItem(key)
    return value === null ? fallback : JSON.parse(value)
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}
