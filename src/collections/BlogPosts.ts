import { slugField, type CollectionConfig } from 'payload'

export const BlogPosts: CollectionConfig = {
  slug: 'blogPosts',
  trash: true,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date'],
    preview: (doc) => {
      const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
      const slug = typeof doc?.slug === 'string' ? doc.slug : ''
      const encodedParams = new URLSearchParams({
        slug,
        collection: 'blogPosts',
        path: `/blog/${slug}`,
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
      name: 'date',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: {
        description: 'When the post was published.',
      },
    },
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
      fieldToUse: 'title',
    }),
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'byline',
      type: 'text',
      admin: {
        description: 'Who wrote this post?',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
    },
  ],
}
