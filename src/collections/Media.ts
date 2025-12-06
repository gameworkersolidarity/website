import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  trash: true,
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
      name: 'alt',
      type: 'text',
    },
  ],
  upload: true,
}
