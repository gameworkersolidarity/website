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
      defaultValue: 'Submit an Event',
      admin: {
        description: 'The title displayed on the event submission page',
      },
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
