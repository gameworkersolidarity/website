'use server'

import config from '@payload-config'
import { BasePayload, getPayload } from 'payload'
import { loadDraftMode } from './auth'

export async function payloadUserQuery(...args: Parameters<BasePayload['find']>) {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { draftModeStatus, authStatus } = await loadDraftMode(payload)

  // Fetch all published companies
  const query = args[0]
  const companiesResult = await payload.find({
    draft: draftModeStatus.isEnabled,
    user: authStatus.user,
    overrideAccess: false,
    ...query,
  })

  return companiesResult
}

export async function payloadUserGlobalQuery(...args: Parameters<BasePayload['findGlobal']>) {
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { draftModeStatus, authStatus } = await loadDraftMode(payload)

  const query = args[0]
  const globalResult = await payload.findGlobal({
    draft: draftModeStatus.isEnabled,
    user: authStatus.user,
    overrideAccess: false,
    ...query,
  })

  return globalResult
}
