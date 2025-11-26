import { slugField, type CollectionConfig } from 'payload'

export const Companies: CollectionConfig = {
  slug: 'companies',
  trash: true,
  admin: {
    useAsTitle: 'Name',
    preview: (doc) => {
      const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
      const slug = typeof doc?.slug === 'string' ? doc.slug : ''
      const encodedParams = new URLSearchParams({
        slug,
        collection: 'companies',
        path: `/companies/${slug}`,
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
      name: 'Children',
      type: 'relationship',
      relationTo: 'companies',
      hasMany: true,
      admin: {
        description: 'Child/subsidiary companies',
      },
    },
    slugField({
      fieldToUse: 'Name',
    }),
  ],
}
