'use client'
import { projectStrings } from '@/project-strings'
import { RefreshRouteOnSave as PayloadLivePreview } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation.js'
import React from 'react'

export const RefreshRouteOnSave: React.FC = () => {
  const router = useRouter()

  return <PayloadLivePreview refresh={() => router.refresh()} serverURL={projectStrings.baseUrl} />
}
