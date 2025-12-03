import { colorPickerField } from '@/components/payloadcms/ColourPickerField'
import { projectStrings } from '@/project-strings'
import { slugField, type CollectionConfig } from 'payload'
import { getPath } from '@/utils/payloadPath'
import { createBreadcrumbsField } from '@payloadcms/plugin-nested-docs'
import { OrganisingGroup } from '@/payload-types'

export const OrganisingGroups: CollectionConfig = {
  slug: 'organisingGroups',
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
        collection: 'organisingGroups',
        path: getPath('organisingGroups', doc as unknown as OrganisingGroup),
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
    colorPickerField({
      name: 'primaryColor',
      label: 'Primary Color',
      admin: {
        position: 'sidebar',
        description: 'Choose a color for this page',
      },
    }),
    {
      name: 'color',
      type: 'text',
      virtual: true,
      admin: {
        hidden: true,
        readOnly: true,
      },
      typescriptSchema: [({ jsonSchema }) => ({ ...jsonSchema, type: 'string' })],
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            return siblingData.primaryColor || '#EEE'
          },
        ],
      },
    },
    {
      name: 'fullName',
      type: 'text',
    },
    {
      name: 'countries',
      type: 'relationship',
      relationTo: 'countries',
      hasMany: true,
      admin: {
        description: 'Countries where this group organises.',
      },
    },
    {
      name: 'companies',
      type: 'relationship',
      relationTo: 'companies',
      hasMany: true,
      admin: {
        description: 'Companies this group organises workers within.',
      },
    },
    {
      name: 'isUnion',
      type: 'checkbox',
    },
    {
      name: 'website',
      type: 'text',
    },
    {
      name: 'webshiteHostname',
      type: 'text',
      virtual: true,
      admin: {
        hidden: true,
      },
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            if (!siblingData.website) {
              return null
            }
            return new URL(siblingData.website).hostname
          },
        ],
      },
    },
    {
      name: 'bluesky',
      type: 'text',
    },
    {
      name: 'blueskyHandle',
      type: 'text',
      virtual: true,
      admin: {
        hidden: true,
      },
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            if (!siblingData.bluesky) {
              return null
            }
            return new URL(siblingData.bluesky).pathname.replace(/\//gim, '')
          },
        ],
      },
    },
    {
      name: 'twitter',
      type: 'text',
    },
    {
      name: 'twitterHandle',
      type: 'text',
      virtual: true,
      admin: {
        hidden: true,
      },
      hooks: {
        afterRead: [
          ({ siblingData }) => {
            if (!siblingData.twitter) {
              return null
            }
            return new URL(siblingData.twitter).pathname.replace(/\//gim, '')
          },
        ],
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
            return getPath('organisingGroups', siblingData as unknown as OrganisingGroup)
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
              getPath('organisingGroups', siblingData as unknown as OrganisingGroup),
              projectStrings.baseUrl,
            ).toString()
          },
        ],
      },
    },
    createBreadcrumbsField('organisingGroups', {
      name: 'parents',
      admin: {
        description: 'Parents of this organising group.',
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
            return `/admin/collections/organisingGroups/${siblingData.id}`
          },
        ],
      },
    },
  ],
}
