const currencyLabels: Record<string, string> = {
  XOF: 'F',
  FCFA: 'F',
  EUR: '€',
  USD: '$',
}

export function formatAmount(amount: number, currency = 'XOF') {
  const n = Number(amount)
  const formatted = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n)
  const suffix = currencyLabels[currency] ?? currency
  return `${formatted} ${suffix}`
}

export function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export function isSameDay(iso: string, date = new Date()) {
  const d = new Date(iso)
  return (
    d.getFullYear() === date.getFullYear() &&
    d.getMonth() === date.getMonth() &&
    d.getDate() === date.getDate()
  )
}

export function startOfDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export function startOfWeek(date = new Date()) {
  const d = new Date(date)
  const day = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export function endOfWeek(date = new Date()) {
  const d = startOfWeek(date)
  d.setDate(d.getDate() + 7)
  d.setMilliseconds(-1)
  return d
}

export function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

export function startOfYear(date = new Date()) {
  return new Date(date.getFullYear(), 0, 1)
}

export function endOfYear(date = new Date()) {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999)
}

export type SpendPeriod = 'day' | 'week' | 'month' | 'year'

export const SPEND_PERIODS: { id: SpendPeriod; label: string }[] = [
  { id: 'day', label: 'Jour' },
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
  { id: 'year', label: 'Année' },
]

export const SPEND_PERIOD_CAPTION: Record<SpendPeriod, string> = {
  day: "Aujourd'hui",
  week: 'Cette semaine',
  month: 'Ce mois',
  year: 'Cette année',
}

export function periodRange(period: SpendPeriod, date = new Date()) {
  if (period === 'day') return { start: startOfDay(date), end: endOfDay(date) }
  if (period === 'week') return { start: startOfWeek(date), end: endOfWeek(date) }
  if (period === 'month') return { start: startOfMonth(date), end: endOfMonth(date) }
  return { start: startOfYear(date), end: endOfYear(date) }
}

export function isInPeriod(iso: string, period: SpendPeriod, date = new Date()) {
  if (!iso) return false
  const t = new Date(iso)
  if (Number.isNaN(t.getTime())) return false
  if (period === 'day') return isSameDay(iso, date)
  const { start, end } = periodRange(period, date)
  return t.getTime() >= start.getTime() && t.getTime() <= end.getTime()
}

export function dateKey(value: Date | string) {
  const d = typeof value === 'string' ? new Date(value) : value
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function dateAndTimeFromIso(iso: string | null | undefined) {
  if (!iso) return { date: null as Date | null, time: null as Date | null }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { date: null, time: null }
  return { date: d, time: d }
}

export function formatMonthTitle(date: Date) {
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}
