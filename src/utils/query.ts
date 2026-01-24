import { useCallback, useEffect, useState } from 'react'

type UseAsyncOptions<T, E extends Error> = {
  shouldTrigger?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: E) => void
}

/**  Like SWR but without caching */
export const useAsync = <T, E extends Error>(
  _: string | any[],
  fn: () => Promise<T>,
  { shouldTrigger = true, onSuccess, onError }: UseAsyncOptions<T, E> = {},
) => {
  const [data, setData] = useState<T | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<E | unknown | undefined>(undefined)

  const trigger = useCallback(async () => {
    setError(undefined)
    try {
      const result = await fn()
      setData(result)
      onSuccess?.(result)
    } catch (err) {
      setError(err)
      onError?.(err as E)
    } finally {
      setIsLoading(false)
    }
  }, [fn, onSuccess, onError])

  useEffect(() => {
    if (shouldTrigger) trigger()
  }, [trigger, shouldTrigger])

  return { data, isLoading, error, trigger }
}
