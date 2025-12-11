import type { GlobalConfig } from 'payload'

export const DataPage: GlobalConfig = {
  slug: 'dataPage',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
      admin: {
        description: 'Rich text description for the data page',
      },
    },
  ],
}

