import { useRef, useEffect, Dispatch, SetStateAction, useState } from 'react';
import qs from 'query-string';
import { useRouter } from 'next/dist/client/router';
import { useDebouncedCallback } from 'use-debounce'
import isEqual from 'lodash.isequal'

type URLStateOptions<RawValue> = {
  key: string
  initialValue: RawValue
  emptyValue: RawValue
  serialiseObjectToState: (key: string, value: string | string[] | null) => RawValue
  serialiseStateToObject: (key: string, state: RawValue) => object
}

/**
 * Subscribe to some URL keys
 */
export function useURLStateFactory () {
  const router = useRouter()
  const params = useRef({})

  return function <
    RawValue = any
  >(
    options: Pick<URLStateOptions<RawValue>, 'key' | 'emptyValue'> & Partial<URLStateOptions<RawValue>>
  ) {
    const {
      serialiseObjectToState,
      serialiseStateToObject,
      initialValue,
      emptyValue,
      key
    } = Object.assign(
      {
        serialiseObjectToState: (key, nextState) => nextState as any,
        serialiseStateToObject: (key: string, state: any) => {
          const url = qs.parseUrl(router.asPath)
          const currentURLValue = url.query[key]
          // console.info("Syncing new state to URL", key, currentURLValue, state)
          if (isEqual(state, emptyValue)) {
            return ({ [key]: undefined })
          }
          return ({ [key]: state })
        }
      } as URLStateOptions<RawValue>,
      options
    )

    // Look for initial value from `key`
    const initialUrlValue = qs.parseUrl(router.asPath).query[key]
    const initialStateValue = serialiseObjectToState(key, initialUrlValue)

    // Initialise state
    const [state, setState] = useState(initialStateValue || initialValue || emptyValue)

    const updateURL = useDebouncedCallback(() => {
      const { query } = qs.parseUrl(router.asPath)
      const nextQuery = params.current
      if (isEqual(query, nextQuery)) {
        // console.info("Update URL called, but URL was the same as before", query, nextQuery)
      } else {
        router.push({ query: nextQuery }, undefined, { shallow: true })
      }
    }, 500)

    // When the URL changes, sync it to state
    useEffect(function deserialiseURLToState() {
      const handleRouteChange = (url, { shallow }) => {
        if (shallow) return
        const params = qs.parseUrl(url)
        const nextState = serialiseObjectToState(key, params.query[key])
        if (isEqual(state, nextState)) return
        // console.info(`Syncing new URL params to state`, key, state, nextState)
        setState(nextState)
      }
      router.events.on('routeChangeComplete', handleRouteChange)
      return () => {
        router.events.off('routeChangeComplete', handleRouteChange)
      }
    }, [state])

    // Update URL object when state changes
    useEffect(function serialiseStateToURL() {
      params.current = ({ ...params.current, ...serialiseStateToObject(key, state) })
      for (const key in params.current) {
        if (!params.current[key]) {
          delete params.current[key]
        }
      }
      updateURL()
    }, [state /* state value */])

    // Pass through state
    return [state, setState, options] as const
  }
}