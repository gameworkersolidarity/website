import type { GlobalConfig } from 'payload'

export const CampaignsPage: GlobalConfig = {
  slug: 'campaignsPage',
  access: {
    read: () => true,
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
