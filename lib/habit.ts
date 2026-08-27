import { dateKey } from '@/lib/format'

export const WEEKDAYS = [
  { value: 0, short: 'Lun', label: 'Lundi' },
  { value: 1, short: 'Mar', label: 'Mardi' },
  { value: 2, short: 'Mer', label: 'Mercredi' },
  { value: 3, short: 'Jeu', label: 'Jeudi' },
  { value: 4, short: 'Ven', label: 'Vendredi' },
  { value: 5, short: 'Sam', label: 'Samedi' },
  { value: 6, short: 'Dim', label: 'Dimanche' },
] as const

export const HABIT_INTERVALS = [1, 2, 3, 4, 5, 7, 14] as const

export type HabitEvery = 'weekly' | 'interval'

export type HabitConfig = {
  every: HabitEvery
  days: number[]
  interval_days: number
  hour: number
  minute: number
  from: string | null
  last_done_on: string | null
}

export function defaultHabit(): HabitConfig {
  const now = new Date()
  return {
    every: 'weekly',
    days: [0, 1, 2, 3, 4, 5, 6],
    interval_days: 1,
    hour: 7,
    minute: 0,
    from: dateKey(now),
    last_done_on: null,
  }
}

function asHour(value: unknown, fallback = 7) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(23, Math.max(0, Math.round(n)))
}

function asMinute(value: unknown, fallback = 0) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.min(59, Math.max(0, Math.round(n)))
}

export function parseHabit(value: unknown): HabitConfig | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<HabitConfig> & { type?: string }
  if (
    raw.every == null &&
    raw.type == null &&
    raw.days == null &&
    raw.hour == null &&
    raw.interval_days == null
  ) {
    return null
  }
  const every: HabitEvery = raw.every === 'interval' || raw.type === 'interval' ? 'interval' : 'weekly'
  const days = Array.isArray(raw.days)
    ? raw.days.map((day) => Number(day)).filter((day) => day >= 0 && day <= 6)
    : [0, 1, 2, 3, 4, 5, 6]
  const interval = Number(raw.interval_days)
  return {
    every,
    days: days.length ? [...new Set(days)].sort((a, b) => a - b) : [0, 1, 2, 3, 4, 5, 6],
    interval_days: HABIT_INTERVALS.includes(interval as (typeof HABIT_INTERVALS)[number]) ? interval : 1,
    hour: asHour(raw.hour),
    minute: asMinute(raw.minute),
    from: typeof raw.from === 'string' && raw.from ? raw.from : dateKey(new Date()),
    last_done_on: typeof raw.last_done_on === 'string' && raw.last_done_on ? raw.last_done_on : null,
  }
}

export function isHabitTodo(todo: { kind?: string | null; habit?: unknown }) {
  return todo.kind === 'habit' || Boolean(parseHabit(todo.habit))
}

export function isTodoOpen(todo: { done?: boolean; kind?: string | null; habit?: unknown }) {
  if (isHabitTodo(todo)) return !isHabitDoneToday(parseHabit(todo.habit))
  return !todo.done
}

export function habitPayload(config: HabitConfig): HabitConfig {
  return {
    every: config.every,
    days: config.every === 'weekly' ? config.days : [],
    interval_days: config.every === 'interval' ? config.interval_days : 1,
    hour: config.hour,
    minute: config.minute,
    from: config.from,
    last_done_on: config.last_done_on,
  }
}

export function frenchWeekday(date = new Date()) {
  return (date.getDay() + 6) % 7
}

function atTime(date: Date, hour: number, minute: number) {
  const next = new Date(date)
  next.setHours(hour, minute, 0, 0)
  return next
}

function parseFrom(from: string | null) {
  if (!from) return startOfLocalDay(new Date())
  const [y, m, d] = from.split('-').map(Number)
  if (!y || !m || !d) return startOfLocalDay(new Date())
  return new Date(y, m - 1, d)
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function daysBetween(a: Date, b: Date) {
  return Math.round((startOfLocalDay(b).getTime() - startOfLocalDay(a).getTime()) / 86_400_000)
}

export function nextHabitDates(config: HabitConfig, count = 16, from = new Date()): Date[] {
  const dates: Date[] = []
  if (config.every === 'weekly') {
    const days = config.days.length ? config.days : [frenchWeekday(from)]
    for (let offset = 0; offset < 80 && dates.length < count; offset += 1) {
      const day = new Date(from)
      day.setDate(from.getDate() + offset)
      if (!days.includes(frenchWeekday(day))) continue
      const when = atTime(day, config.hour, config.minute)
      if (when.getTime() <= Date.now() + 5000) continue
      dates.push(when)
    }
    return dates
  }

  const origin = parseFrom(config.from)
  const step = Math.max(1, config.interval_days)
  let elapsed = daysBetween(origin, from)
  if (elapsed < 0) elapsed = 0
  let nextOffset = elapsed % step === 0 ? elapsed : elapsed + (step - (elapsed % step))
  for (let i = 0; i < 80 && dates.length < count; i += 1) {
    const day = new Date(origin)
    day.setDate(origin.getDate() + nextOffset + i * step)
    const when = atTime(day, config.hour, config.minute)
    if (when.getTime() <= Date.now() + 5000) continue
    dates.push(when)
  }
  return dates
}

export function nextHabitAt(config: HabitConfig, from = new Date()) {
  return nextHabitDates(config, 1, from)[0] ?? null
}

export function isHabitDueToday(config: HabitConfig, date = new Date()) {
  if (config.every === 'weekly') {
    return config.days.includes(frenchWeekday(date))
  }
  const origin = parseFrom(config.from)
  const elapsed = daysBetween(origin, date)
  return elapsed >= 0 && elapsed % Math.max(1, config.interval_days) === 0
}

export function isHabitDueThisWeek(config: HabitConfig, date = new Date()) {
  const start = startOfLocalDay(date)
  start.setDate(start.getDate() - frenchWeekday(date))
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    if (isHabitDueToday(config, day)) return true
  }
  return false
}

export function isHabitDoneToday(config: HabitConfig | null | undefined, date = new Date()) {
  return Boolean(config?.last_done_on && config.last_done_on === dateKey(date))
}

export function formatHabitTime(config: HabitConfig) {
  return `${String(config.hour).padStart(2, '0')}:${String(config.minute).padStart(2, '0')}`
}

export function habitSummary(config: HabitConfig) {
  const time = formatHabitTime(config)
  if (config.every === 'interval') {
    if (config.interval_days === 1) return `Tous les jours · ${time}`
    return `Tous les ${config.interval_days} jours · ${time}`
  }
  if (config.days.length === 7) return `Tous les jours · ${time}`
  if (config.days.length === 0) return time
  const labels = config.days.map((day) => WEEKDAYS[day]?.short ?? '').filter(Boolean)
  return `${labels.join(' · ')} · ${time}`
}

export function expoWeekday(frenchDay: number) {
  return frenchDay === 6 ? 1 : frenchDay + 2
}

export function isDailyHabit(config: HabitConfig) {
  return (
    (config.every === 'weekly' && config.days.length === 7) ||
    (config.every === 'interval' && config.interval_days === 1)
  )
}
