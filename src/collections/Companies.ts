import { slugField, type CollectionConfig } from 'payload'

export const Companies: CollectionConfig = {
  slug: 'companies',
  admin: {
    useAsTitle: 'Name',
  },
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
      name: 'airtableId',
      type: 'text',
      unique: true,
      admin: {
        description: 'Legacy Airtable ID for URL redirects',
      },
      hidden: true,
    },
    {
      name: 'Name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'Summary',
      type: 'richText',
    },
    {
      name: 'SolidarityActions',
      type: 'relationship',
      relationTo: 'solidarityActions',
      hasMany: true,
    },
    slugField({
      fieldToUse: 'Name',
    }),
  ],
}
