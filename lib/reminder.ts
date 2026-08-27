export const REMINDER_MODES = [
  { value: 'push', label: 'Notification', hint: 'Bandeau discret' },
  { value: 'alert', label: 'Alerte', hint: 'Réveil + vibreur' },
  { value: 'both', label: 'Les deux', hint: 'Bandeau + réveil' },
] as const

export const REMINDER_SOUNDS = [
  { value: 'default', label: 'Défaut' },
  { value: 'alarm', label: 'Réveil' },
  { value: 'chime', label: 'Carillon' },
  { value: 'urgent', label: 'Urgent' },
] as const

export const REMINDER_INTERVALS = [
  { value: 0, label: 'Une fois' },
  { value: 5, label: 'Toutes les 5 min' },
  { value: 15, label: 'Toutes les 15 min' },
  { value: 30, label: 'Toutes les 30 min' },
  { value: 60, label: 'Toutes les heures' },
  { value: 180, label: 'Toutes les 3 h' },
  { value: 360, label: 'Toutes les 6 h' },
  { value: 720, label: 'Toutes les 12 h' },
  { value: 1440, label: 'Tous les jours' },
  { value: 10080, label: 'Toutes les semaines' },
] as const

export const REMINDER_LEADS = [
  { value: 5, label: '5 min avant' },
  { value: 15, label: '15 min avant' },
  { value: 30, label: '30 min avant' },
  { value: 60, label: '1 h avant' },
  { value: 180, label: '3 h avant' },
  { value: 720, label: '12 h avant' },
  { value: 1440, label: '1 jour avant' },
  { value: 2880, label: '2 jours avant' },
  { value: 4320, label: '3 jours avant' },
  { value: 10080, label: '1 semaine avant' },
] as const

export const REMINDER_COUNTS = [1, 2, 3, 4, 5, 7, 10] as const

export type ReminderMode = (typeof REMINDER_MODES)[number]['value']
export type ReminderSound = (typeof REMINDER_SOUNDS)[number]['value']

export type ReminderConfig = {
  enabled: boolean
  mode: ReminderMode
  sound: ReminderSound
  start_at: string | null
  interval_minutes: number
  count: number
  leads?: number[]
}

export const REMINDER_SOUND_FILES: Record<Exclude<ReminderSound, 'default'>, string> = {
  alarm: 'alarm.wav',
  chime: 'chime.wav',
  urgent: 'urgent.wav',
}

export const REMINDER_SOUND_ASSETS = {
  default: require('@/assets/sounds/alarm.wav'),
  alarm: require('@/assets/sounds/alarm.wav'),
  chime: require('@/assets/sounds/chime.wav'),
  urgent: require('@/assets/sounds/urgent.wav'),
}

function knownInterval(value: number) {
  return (
    REMINDER_INTERVALS.some((item) => item.value === value) ||
    REMINDER_LEADS.some((item) => item.value === value)
  )
}

function parseLeads(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((item) => Number(item)).filter((item) => REMINDER_LEADS.some((lead) => lead.value === item)))]
}

export function defaultReminder(mode: ReminderMode = 'both'): ReminderConfig {
  return {
    enabled: false,
    mode,
    sound: 'alarm',
    start_at: null,
    interval_minutes: 0,
    count: 1,
    leads: [30],
  }
}

export function parseReminder(value: unknown, fallbackMode: ReminderMode = 'both'): ReminderConfig {
  const base = defaultReminder(fallbackMode)
  if (!value || typeof value !== 'object') return base
  const raw = value as Partial<ReminderConfig>
  const interval = Number(raw.interval_minutes)
  const count = Number(raw.count)
  const leads = parseLeads(raw.leads)
  return {
    enabled: Boolean(raw.enabled),
    mode: REMINDER_MODES.some((item) => item.value === raw.mode) ? (raw.mode as ReminderMode) : fallbackMode,
    sound: REMINDER_SOUNDS.some((item) => item.value === raw.sound)
      ? (raw.sound as ReminderSound)
      : 'alarm',
    start_at: typeof raw.start_at === 'string' && raw.start_at ? raw.start_at : null,
    interval_minutes: knownInterval(interval) ? interval : 0,
    count: REMINDER_COUNTS.includes(count as (typeof REMINDER_COUNTS)[number]) ? count : 1,
    leads: leads.length ? leads : interval > 0 && REMINDER_LEADS.some((item) => item.value === interval) ? [interval] : [30],
  }
}

export function reminderPayload(config: ReminderConfig): ReminderConfig | null {
  if (!config.enabled) return null
  return {
    enabled: true,
    mode: config.mode,
    sound: config.sound,
    start_at: config.start_at,
    interval_minutes: config.interval_minutes,
    count: config.interval_minutes > 0 ? config.count : 1,
    leads: config.leads?.length ? config.leads : undefined,
  }
}

export function reminderOccurrences(config: ReminderConfig, bases: Date[]) {
  if (!config.enabled) return []
  const count = config.interval_minutes > 0 ? Math.min(Math.max(config.count, 1), 10) : 1
  const intervalMs = Math.max(config.interval_minutes, 0) * 60_000
  const dates: Date[] = []
  for (const base of bases) {
    if (Number.isNaN(base.getTime())) continue
    for (let i = 0; i < count; i += 1) {
      const when = new Date(base.getTime() + i * intervalMs)
      if (when.getTime() > Date.now() + 5000) dates.push(when)
    }
  }
  return dates
}

export function reminderFireDates(config: ReminderConfig, fallback: Date | null) {
  const start = config.start_at ? new Date(config.start_at) : fallback
  if (!start || Number.isNaN(start.getTime())) return []
  return reminderOccurrences(config, [start])
}

export function reminderFireDatesBefore(config: ReminderConfig, deadline: Date) {
  if (!config.enabled || Number.isNaN(deadline.getTime())) return []
  const cutoff = deadline.getTime()
  const now = Date.now() + 5000
  const leads = config.leads?.length
    ? config.leads
    : config.interval_minutes > 0
      ? [config.interval_minutes]
      : [30]
  const dates: Date[] = []
  for (const lead of leads) {
    const when = new Date(cutoff - lead * 60_000)
    if (when.getTime() > now && when.getTime() < cutoff) dates.push(when)
  }
  if (config.start_at) {
    const custom = new Date(config.start_at)
    if (custom.getTime() > now && custom.getTime() < cutoff) dates.push(custom)
  }
  return [...new Map(dates.map((date) => [date.getTime(), date])).values()].sort(
    (a, b) => a.getTime() - b.getTime()
  )
}

export function reminderFireDatesUntilDone(config: ReminderConfig, fallback: Date | null, limit = 12) {
  if (!config.enabled) return []
  const start = config.start_at ? new Date(config.start_at) : fallback
  if (!start || Number.isNaN(start.getTime())) return []
  const intervalMin = config.interval_minutes > 0 ? config.interval_minutes : 60
  const intervalMs = intervalMin * 60_000
  const now = Date.now() + 5000
  const dates: Date[] = []
  if (start.getTime() > now) dates.push(new Date(start))
  let next = start.getTime()
  if (next <= now) {
    const steps = Math.floor((now - next) / intervalMs) + 1
    next += steps * intervalMs
  } else {
    next += intervalMs
  }
  while (dates.length < limit) {
    dates.push(new Date(next))
    next += intervalMs
  }
  return dates
}
