/**
 * Content files are application-wide constants. Freeze nested arrays and
 * objects once at the data boundary so a view or domain function cannot
 * accidentally mutate the rules used by a later battle or save operation.
 */
export function deepFreeze<T>(value: T): T {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return value

  for (const key of Reflect.ownKeys(value)) {
    const child = (value as Record<PropertyKey, unknown>)[key]
    deepFreeze(child)
  }

  return Object.freeze(value)
}
