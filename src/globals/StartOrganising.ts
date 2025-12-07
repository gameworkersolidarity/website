import type { GlobalConfig } from 'payload'

export const StartOrganising: GlobalConfig = {
  slug: 'startOrganising',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
      admin: {
        description: 'Rich text description for the start organising page',
      },
    },
  ],
}

