import { projectStrings } from '@/project-strings'
import { slugField, type CollectionConfig } from 'payload'
import { getPath } from '@/utils/payloadPath'

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
        path: getPath('staticPages', { slug }),
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
      position: 'sidebar',
      required: true,
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
    {
      name: 'path',
      type: 'text',
      virtual: true,
      typescriptSchema: [({ jsonSchema }) => ({ ...jsonSchema, type: 'string' })],
      hidden: true,
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            return getPath('staticPages', { slug: siblingData.slug })
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
              getPath('staticPages', { slug: siblingData.slug }),
              projectStrings.baseUrl,
            ).toString()
          },
        ],
      },
    },
  ],
}
