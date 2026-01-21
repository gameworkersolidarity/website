import type { GlobalConfig } from 'payload'

export const ActionSubmissionPage: GlobalConfig = {
  slug: 'actionSubmissionPage',
  access: {
    read: () => true,
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
