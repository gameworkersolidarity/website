export const stringifyArray = <T>(...ds: T[]): string => {
  return unique(...noNull(...ds)).join(", ")
}

export const noNull = <T>(...ds: T[]) => {
  return ds.filter(Boolean)
}

export const unique = <T>(...ds: T[]) => {
  return Array.from(new Set(ds))
}