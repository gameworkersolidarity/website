import type { GlobalConfig } from 'payload'

export const AboutPage: GlobalConfig = {
  slug: 'aboutPage',
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
