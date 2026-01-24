'use server'

import config from '@payload-config'
import type { Payload } from 'payload'
import { getPayload } from 'payload'
import { loadDraftMode } from './auth'

export const payloadUserQuery: Payload['find'] = async (options) => {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { draftModeStatus, authStatus } = await loadDraftMode(payload)

  return payload.find({
    ...options,
    draft: draftModeStatus.isEnabled,
    user: authStatus.user,
    overrideAccess: false,
  } as typeof options)
}

export const payloadUserGlobalQuery: Payload['findGlobal'] = async (options) => {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { draftModeStatus, authStatus } = await loadDraftMode(payload)

  return payload.findGlobal({
    ...options,
    draft: draftModeStatus.isEnabled,
    user: authStatus.user,
    overrideAccess: false,
  } as typeof options)
}
