import type { GlobalConfig } from 'payload'

export const EventSubmissionPage: GlobalConfig = {
  slug: 'eventSubmissionPage',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Page Title',
      admin: {
        description: 'Title for the event submission page',
      },
      defaultValue: 'Submit an Event',
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Description',
      admin: {
        description: 'Rich text description for the event submission page',
      },
    },
  ],
}
