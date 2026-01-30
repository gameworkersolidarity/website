import { projectStrings } from '@/project-strings'
import { slugField, type CollectionConfig } from 'payload'
import { getPath } from '@/utils/payloadPath'
import { createBreadcrumbsField } from '@payloadcms/plugin-nested-docs'
import { Company } from '@/payload-types'
import { draftModeAccessControl } from '@/app/(payload)/querying/accessControl'

export const Companies: CollectionConfig = {
  slug: 'companies',
  trash: true,
  admin: {
    useAsTitle: 'name',
    preview: (doc) => {
      if (!doc?.slug || typeof doc.slug !== 'string' || !doc.slug.trim()) {
        return null
      }

      const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
      const slug = doc.slug
      const encodedParams = new URLSearchParams({
        slug,
        collection: 'companies',
        path: getPath('companies', doc as unknown as Company),
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
      unique: true,
      required: true,
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
      name: 'countries',
      type: 'relationship',
      relationTo: 'countries',
      hasMany: true,
      admin: {
        description: 'Countries where this company has workers.',
      },
    },
    {
      name: 'actions',
      type: 'join',
      collection: 'actions',
      on: 'companies',
      admin: {
        description: 'Actions associated with this company.',
      },
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
            return getPath('companies', siblingData as unknown as Company)
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
              getPath('companies', siblingData as unknown as Company),
              projectStrings.baseUrl,
            ).toString()
          },
        ],
      },
    },
    createBreadcrumbsField('companies', {
      name: 'parents',
      admin: {
        description: 'Parents of this company.',
        hidden: true,
      },
    }),

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
            return `/admin/collections/companies/${siblingData.id}`
          },
        ],
      },
    },
  ],
}
