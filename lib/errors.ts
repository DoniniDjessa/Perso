export function errorMessage(e: unknown, fallback = 'Enregistrement impossible.') {
  if (!e) return fallback
  if (typeof e === 'string' && e.trim()) return e
  if (e instanceof Error && e.message.trim()) return e.message
  if (typeof e === 'object' && e !== null && 'message' in e) {
    const message = (e as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return fallback
}

export function missingColumn(message: string | null | undefined) {
  if (!message) return null
  const match =
    message.match(/Could not find the '([^']+)' column/i) ||
    message.match(/column "([^"]+)" of relation/i)
  return match?.[1] ?? null
}
