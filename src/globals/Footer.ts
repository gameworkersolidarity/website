import { draftModeAccessControl } from '@/app/(payload)/querying/accessControl'
import type { GlobalConfig } from 'payload'
import { projectStrings } from '@/project-strings'

export const Footer: GlobalConfig = {
  slug: 'footer',
  admin: {
    preview: () => {
      const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
      const baseURL = projectStrings.baseUrl
      const encodedParams = new URLSearchParams({
        path: '/',
        previewSecret,
      })
      return `${baseURL}/preview?${encodedParams.toString()}`
    },
  },
  access: {
    read: draftModeAccessControl,
  },
  versions: {
    drafts: {
      autosave: {
        interval: 2000,
      },
      schedulePublish: true,
    },
  },
  fields: [
    {
      name: 'navigation',
      type: 'array',
      label: 'Navigation Items',
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
  ],
}
