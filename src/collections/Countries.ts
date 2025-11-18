import { slugField, type CollectionConfig } from 'payload'
import coords from 'country-coords'

export const Countries: CollectionConfig = {
  slug: 'countries',
  trash: true,
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
    },
    {
      name: 'countryCode',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'Summary',
      type: 'richText',
    },
    slugField({
      fieldToUse: 'Name',
    }),
    {
      name: 'Unions',
      type: 'relationship',
      relationTo: 'organisingGroups',
      hasMany: true,
    },
    {
      name: 'SolidarityActions',
      type: 'relationship',
      relationTo: 'solidarityActions',
      hasMany: true,
    },
    {
      name: 'coords',
      type: 'json',
      virtual: true,
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            if (!siblingData.countryCode) {
              return null
            }
            const countryData = coords[siblingData.countryCode]
            return countryData || null
          },
        ],
      },
    },
  ],
}
