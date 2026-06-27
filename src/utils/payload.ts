import { PayloadSDK } from '@payloadcms/sdk'
import type { Config, Action } from '@/payload-types'

// Pass your config from generated types as generic
export const payloadClient = new PayloadSDK<Config>({
  baseURL: '/api',
})
