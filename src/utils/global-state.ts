import { useAtom } from 'jotai/react'
import { atomWithStorage } from 'jotai/utils'
import { useQueryState } from 'nuqs'

export enum ZoomLevel {
  Compact = 'compact',
  Preview = 'preview',
  Detailed = 'detailed',
}

export const zoomLevelAtom = atomWithStorage<ZoomLevel>('zoomLevel', ZoomLevel.Compact)

export function useZoomLevel() {
  return useAtom(zoomLevelAtom)
}

export function useCountryFilter() {
  return useQueryState('country', { clearOnDefault: true })
}

export function useCategoryFilter() {
  return useQueryState('category', { clearOnDefault: true })
}

export function useCompanyFilter() {
  return useQueryState('company', { clearOnDefault: true })
}

export function useUnionFilter() {
  return useQueryState('union', { clearOnDefault: true })
}

export function useYearFilter() {
  return useQueryState('year', { clearOnDefault: true })
}
