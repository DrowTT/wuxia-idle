export function dateKey(timestamp = Date.now()): string {
  const date = new Date(typeof timestamp === 'number' && Number.isFinite(timestamp) ? timestamp : Date.now())
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function normalizeDateKey(value: unknown): string | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year = 0, month = 0, day = 0] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? value : null
}

/** Returns the local date key for the Monday that starts the current week. */
export function weekKey(timestamp = Date.now()): string {
  const date = new Date(typeof timestamp === 'number' && Number.isFinite(timestamp) ? timestamp : Date.now())
  const dayFromMonday = (date.getDay() + 6) % 7
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - dayFromMonday)
  return dateKey(date.getTime())
}
