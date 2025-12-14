import { Event } from './payload-types'

declare module 'd3-scale-chromatic'
declare module 'iso-3166-1-codes'
declare module 'country-coords'
declare module '@urbica/react-map-gl-cluster'
declare module 'country-to-bbox'
declare module 'country-flag-emoji'

export type LexicalContent = Event['description']
