import { slugField, type CollectionConfig } from 'payload'

export const StaticPages: CollectionConfig = {
  slug: 'staticPages',
  trash: true,
  admin: {
    useAsTitle: 'title',
    preview: (doc) => {
      const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
      const slug = typeof doc?.slug === 'string' ? doc.slug : ''
      const encodedParams = new URLSearchParams({
        slug,
        collection: 'staticPages',
        path: `/${slug}`,
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
    slugField({
      fieldToUse: 'title',
      checkboxName: 'Generate slug?',
      position: 'sidebar',
    }),
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'summary',
      type: 'text',
      admin: {
        description: 'A short summary of the page. Used for SEO and social media.',
        position: 'sidebar',
      },
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
    },
  ],
}
