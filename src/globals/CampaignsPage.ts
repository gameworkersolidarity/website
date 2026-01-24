import { draftModeAccessControl } from '@/app/(payload)/querying/accessControl'
import type { GlobalConfig } from 'payload'
import { projectStrings } from '@/project-strings'

export const CampaignsPage: GlobalConfig = {
  slug: 'campaignsPage',
  admin: {
    preview: () => {
      const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
      const baseURL = projectStrings.baseUrl
      const encodedParams = new URLSearchParams({
        path: '/campaigns',
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
      name: 'description',
      type: 'richText',
      label: 'Description',
      admin: {
        description: 'Rich text description for the campaigns page',
      },
    },
  ],
}
