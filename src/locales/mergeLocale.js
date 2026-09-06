export default function mergeLocale (base, overrides) {
  if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) return overrides ?? base
  const result = { ...base }
  Object.entries(overrides).forEach(([key, value]) => {
    result[key] = value && typeof value === 'object' && !Array.isArray(value) && typeof base?.[key] === 'object'
      ? mergeLocale(base[key], value)
      : value
  })
  return result
}
