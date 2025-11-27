import { projectStrings } from '@/project-strings'
import { slugField, type CollectionConfig } from 'payload'

function getPath(siblingData: { slug: string }) {
  return `/blog/${siblingData.slug}`
}

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
        path: getPath({ slug }),
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
      required: true,
      position: 'sidebar',
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
    {
      name: 'path',
      type: 'text',
      virtual: true,
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            return getPath(siblingData as unknown as { slug: string })
          },
        ],
      },
    },
    {
      name: 'url',
      type: 'text',
      virtual: true,
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            return new URL(
              getPath(siblingData as unknown as { slug: string }),
              projectStrings.baseUrl,
            ).toString()
          },
        ],
      },
    },
  ],
}
