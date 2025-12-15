import type { GlobalConfig } from 'payload'

export const CampaignsPage: GlobalConfig = {
  slug: 'campaignsPage',
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
      name: 'description',
      type: 'richText',
      label: 'Description',
      admin: {
        description: 'Rich text description for the campaigns page',
      },
    },
  ],
}
