export const noNull = <T>(...ds: T[]) => {
  return ds.filter(Boolean)
}