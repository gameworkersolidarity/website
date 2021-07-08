import { useRef, useEffect, Dispatch, SetStateAction, useState } from 'react';
import qs from 'query-string';
import { useRouter } from 'next/dist/client/router';
import { useDebounce } from 'use-debounce'
import isEqual from 'lodash.isequal'

type URLStateOptions<RawValue> = {
  key: string
  initialValue: RawValue
  emptyValue: RawValue
  serialiseObjectToState: (key: string, value: string | string[] | null) => RawValue
  serialiseStateToObject: (key: string, state: RawValue) => object
}

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
        serialiseObjectToState: (key, value) => value as any,
        serialiseStateToObject: (key: string, nextState: any) => {
          // console.log("State updated, serialise to URL", key, nextState)
          if (isEqual(nextState, emptyValue)) return ({ [key]: undefined })
          return ({ [key]: nextState })
        }
      } as URLStateOptions<RawValue>,
      options
    )

    // Look for initial value from `key`
    const initialUrlValue = qs.parseUrl(router.asPath).query[key]
    const initialStateValue = serialiseObjectToState(key, initialUrlValue)

    // Initialise state
    const [state, setState] = useState(initialStateValue || initialValue || emptyValue)

    const [updateURL] = useDebounce((params) => {
      router.push({ query: params }, undefined, { shallow: true })
    }, 500)

    // When the URL changes, sync it to state
    useEffect(function deserialiseURLToState() {
      const handleRouteChange = (url, { shallow }) => {
        const params = qs.parseUrl(url)
        const nextState = serialiseObjectToState(key, params.query[key])
        if (isEqual(state, nextState)) return
        // console.log(`URL key ${key} is different than state`, state, nextState)
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
      updateURL(params.current)
    }, [state /* state value */])

    // Pass through state
    return [state, setState, options] as const
  }
}