import { draftMode, headers as nextHeaders } from 'next/headers'
import { Payload } from 'payload'

export async function setDraftMode(payload: Payload) {
  // Next — check JWT and set draftMode
  const headers = await nextHeaders()
  const draftModeStatus = await draftMode()
  const authStatus = await payload.auth({ headers, canSetHeaders: false })

  if (authStatus.user) {
    draftModeStatus.enable()
  } else {
    draftModeStatus.disable()
  }

  return {
    draftModeStatus,
    authStatus,
  }
}

export async function fetchDraftMode(payload: Payload) {
  return (await setDraftMode(payload)).draftModeStatus.isEnabled
}
