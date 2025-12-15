import type { GlobalConfig } from 'payload'

export const AboutPage: GlobalConfig = {
  slug: 'aboutPage',
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
        description: 'Rich text description for the about page',
      },
    },
    {
      name: 'credits',
      type: 'richText',
      label: 'Credits',
      admin: {
        description:
          'Rich text credits for the about page. Will be displayed in columns after the description.',
      },
    },
  ],
}
