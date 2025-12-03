import { projectStrings } from '@/project-strings'
import { slugField, type CollectionConfig } from 'payload'
import { getPath } from '@/utils/payloadPath'
import { BlogPost } from '@/payload-types'

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
        path: getPath('blogPosts', doc as unknown as BlogPost),
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
      name: 'adminPath',
      type: 'text',
      virtual: true,
      admin: {
        hidden: true,
        readOnly: true,
      },
      typescriptSchema: [({ jsonSchema }) => ({ ...jsonSchema, type: 'string', required: true })],
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            return `/admin/collections/blogPosts/${siblingData.id}`
          },
        ],
      },
    },
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
      typescriptSchema: [({ jsonSchema }) => ({ ...jsonSchema, type: 'string' })],
      hidden: true,
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            return getPath('blogPosts', siblingData as unknown as BlogPost)
          },
        ],
      },
    },
    {
      name: 'url',
      type: 'text',
      virtual: true,
      typescriptSchema: [({ jsonSchema }) => ({ ...jsonSchema, type: 'string' })],
      hidden: true,
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            return new URL(
              getPath('blogPosts', siblingData as unknown as BlogPost),
              projectStrings.baseUrl,
            ).toString()
          },
        ],
      },
    },
  ],
}
