/** Shared display formatting for resource and combat numbers. */
export function formatCompactNumber(value: number): string {
  const absolute = Math.abs(value)
  if (absolute >= 100_000_000) return `${formatCompactDecimal(value / 100_000_000)}亿`
  if (absolute >= 100_000) return `${formatCompactDecimal(value / 10_000)}万`
  if (absolute < 10_000 && !Number.isInteger(value)) return value.toLocaleString('zh-CN', { maximumFractionDigits: 1 })
  return Math.floor(value).toLocaleString('zh-CN')
}

export function formatIntegerNumber(value: number): string {
  return Math.floor(value).toLocaleString('zh-CN')
}

export function formatCompactIntegerNumber(value: number): string {
  const absolute = Math.abs(value)
  if (absolute >= 100_000_000) return `${Math.floor(value / 100_000_000)}亿`
  if (absolute >= 100_000) return `${Math.floor(value / 10_000)}万`
  return formatIntegerNumber(value)
}

function formatCompactDecimal(value: number): string {
  const digits = Math.abs(value) >= 100 ? 0 : 1
  return value.toFixed(digits).replace(/\.0$/, '')
}
