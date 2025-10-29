import { slugField, type CollectionConfig } from 'payload'

export const StaticPages: CollectionConfig = {
  slug: 'staticPages',
  admin: {
    useAsTitle: 'Title',
  },
  access: {
    read: () => true,
  },
  fields: [
    slugField({
      fieldToUse: 'Title',
    }),
    {
      name: 'Title',
      type: 'text',
      required: true,
    },
    {
      name: 'Summary',
      type: 'text',
    },
    {
      name: 'Body',
      type: 'richText',
      required: true,
    },
    {
      name: 'Public',
      type: 'checkbox',
      defaultValue: true,
      access: {
        read: () => true,
      },
    },
  ],
}
