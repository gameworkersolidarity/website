import { draftMode, headers as nextHeaders } from 'next/headers'
import { Payload } from 'payload'

export async function getAuthStatus(payload: Payload) {
  const headers = await nextHeaders()
  const authStatus = await payload.auth({ headers, canSetHeaders: false })
  return authStatus
}

export async function loadDraftMode(payload: Payload) {
  // Next — check JWT and set draftMode
  const authStatus = await getAuthStatus(payload)
  const draftModeStatus = await draftMode()

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
  return (await loadDraftMode(payload)).draftModeStatus.isEnabled
}
