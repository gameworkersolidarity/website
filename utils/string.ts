export const stringifyArray = (...ds: any[]): string => {
  return unique(...noNull(...ds)).map(s => s.toString().trim()).join(", ")
}

export const noNull = <T>(...ds: T[]) => {
  return ds.filter(Boolean)
}

export const unique = <T>(...ds: T[]) => {
  return Array.from(new Set(ds))
}