import { slugField, type CollectionConfig } from 'payload'

export const OrganisingGroups: CollectionConfig = {
  slug: 'organisingGroups',
  trash: true,
  admin: {
    useAsTitle: 'Name',
    preview: (doc) => {
      const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
      const slug = typeof doc?.slug === 'string' ? doc.slug : ''
      const encodedParams = new URLSearchParams({
        slug,
        collection: 'organisingGroups',
        path: `/organising-groups/${slug}`,
        previewSecret,
      })

      return `/preview?${encodedParams.toString()}`
    },
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
    slugField({
      fieldToUse: 'Name',
    }),
    {
      name: 'Name',
      type: 'text',
      required: true,
    },
    {
      name: 'FullName',
      type: 'text',
    },
    {
      name: 'Country',
      type: 'relationship',
      relationTo: 'countries',
      hasMany: true,
    },
    {
      name: 'IsUnion',
      type: 'checkbox',
    },
    {
      name: 'Website',
      type: 'text',
    },
    {
      name: 'Bluesky',
      type: 'text',
    },
    {
      name: 'Twitter',
      type: 'text',
    },
    {
      name: 'LastModified',
      type: 'date',
      required: true,
    },
    {
      name: 'Children',
      type: 'relationship',
      relationTo: 'organisingGroups',
      hasMany: true,
      admin: {
        description: 'Child/sub-organising groups',
      },
    },
  ],
}
