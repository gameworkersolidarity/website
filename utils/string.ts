export const stringifyArray = (...ds: any[]): string => {
  return unique(...noNull(...ds)).map(s => s.toString().trim()).join(", ")
}

export const noNull = <T>(...ds: T[]) => {
  return ds.filter(Boolean)
}

export const unique = <T>(...ds: T[]) => {
  return Array.from(new Set(ds))
}

export const firstOf = <T>(obj: T, keys: Array<keyof T>, fallbackToAny?: boolean) => {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key]
  }
  if (fallbackToAny) {
    return Object.values(obj)[0]
  }
}

export const ensureArray = <T>(x: T): T[] => {
  if (Array.isArray(x)) return x
  return [x]
}