export const AGENDA_PRIORITIES = [
  { value: 1, label: 'Basse', color: '#C4B5FD' },
  { value: 2, label: 'Moyenne', color: '#7C3AED' },
  { value: 3, label: 'Haute', color: '#312E81' },
] as const

export type AgendaPriority = (typeof AGENDA_PRIORITIES)[number]['value']

export function asPriority(value?: number | string | null): AgendaPriority {
  const n = Number(value)
  return (AGENDA_PRIORITIES.find((item) => item.value === n)?.value ?? 2) as AgendaPriority
}

export function priorityFromEvent(row: { priority?: unknown; reminder?: unknown }): AgendaPriority {
  const reminder = row.reminder
  if (reminder && typeof reminder === 'object' && reminder !== null && 'priority' in reminder) {
    const stored = Number((reminder as { priority?: unknown }).priority)
    if (stored === 1 || stored === 2 || stored === 3) return stored
  }
  return asPriority(row.priority as number | string | null | undefined)
}

export function priorityColor(value?: number | string | null) {
  return AGENDA_PRIORITIES.find((item) => item.value === Number(value))?.color ?? AGENDA_PRIORITIES[1].color
}

export function priorityLabel(value?: number | string | null) {
  return AGENDA_PRIORITIES.find((item) => item.value === Number(value))?.label ?? AGENDA_PRIORITIES[1].label
}
