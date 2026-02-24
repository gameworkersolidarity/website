import type { CollectionConfig } from 'payload'
import { draftModeAccessControl } from '@/app/(payload)/querying/accessControl'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    description: 'Uploaded files (images, documents). Used for rich text and document assets.',
  },
  trash: true,
  access: {
    read: draftModeAccessControl,
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
