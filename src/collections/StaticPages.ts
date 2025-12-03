import { projectStrings } from '@/project-strings'
import { slugField, type CollectionConfig } from 'payload'
import { getPath } from '@/utils/payloadPath'
import { StaticPage } from '@/payload-types'

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
        path: getPath('staticPages', doc as unknown as StaticPage),
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
            return getPath('staticPages', siblingData as unknown as StaticPage)
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
              getPath('staticPages', siblingData as unknown as StaticPage),
              projectStrings.baseUrl,
            ).toString()
          },
        ],
      },
    },

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
            return `/admin/collections/staticPages/${siblingData.id}`
          },
        ],
      },
    },
  ],
}
