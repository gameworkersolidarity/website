import { slugField, type CollectionConfig } from 'payload'
import { projectStrings } from '@/project-strings'
import { getPath } from '@/utils/payloadPath'
import { Category } from '@/payload-types'
import { draftModeAccessControl } from '@/app/(payload)/querying/accessControl'
import { revalidateCacheHook } from '@/lib/revalidate-on-change'
import { after } from 'next/server'

export const Categories: CollectionConfig = {
  slug: 'categories',
  trash: true,
  admin: {
    useAsTitle: 'name',
    description: 'Categories for classifying actions (e.g. strike, protest, campaign type).',
    preview: (doc) => {
      if (!doc?.slug || typeof doc.slug !== 'string' || !doc.slug.trim()) {
        return null
      }

      const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
      const slug = doc.slug
      const encodedParams = new URLSearchParams({
        slug,
        collection: 'categories',
        path: getPath('categories', doc as unknown as Category),
        previewSecret,
      })

      return `/preview?${encodedParams.toString()}`
    },
  },
  access: {
    read: draftModeAccessControl,
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
      fieldToUse: 'name',
      required: true,
      position: 'sidebar',
    }),
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'emoji',
      type: 'text',
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'actions',
      type: 'join',
      collection: 'actions',
      on: 'categories',
      admin: {
        description: 'Actions tagged with this category.',
      },
    },
    {
      name: 'path',
      type: 'text',
      virtual: true,
      hidden: true,
      typescriptSchema: [({ jsonSchema }) => ({ ...jsonSchema, type: 'string' })],
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            return getPath('categories', siblingData as unknown as Category)
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
              getPath('categories', siblingData as unknown as Category),
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
            return `/admin/collections/categories/${siblingData.id}`
          },
        ],
      },
    },
  ],
  hooks: {
    afterChange: [
      async () => {
        after(() => {
          revalidateCacheHook('categories')
        })
      },
    ],
    afterDelete: [revalidateCacheHook('categories')],
  },
}
