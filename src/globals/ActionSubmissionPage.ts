import { draftModeAccessControl } from '@/app/(payload)/querying/accessControl'
import type { GlobalConfig } from 'payload'
import { projectStrings } from '@/project-strings'

export const ActionSubmissionPage: GlobalConfig = {
  slug: 'actionSubmissionPage',
  admin: {
    preview: () => {
      const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
      const baseURL = projectStrings.baseUrl
      const encodedParams = new URLSearchParams({
        path: '/submit',
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
      name: 'title',
      type: 'text',
      label: 'Page Title',
      admin: {
        description: 'Title for the action submission page',
      },
      defaultValue: 'Submit an Action',
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
      admin: {
        description: 'Rich text description for the action submission page',
      },
    },
  ],
}
