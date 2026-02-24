import { slugField, type CollectionConfig } from 'payload'
import { projectStrings } from '@/project-strings'
import { getPath } from '@/utils/payloadPath'
import { Campaign } from '@/payload-types'
import { TimelineLabelProperty } from '@/global-types'
import { draftModeAccessControl } from '@/app/(payload)/querying/accessControl'

const highlightedActionAttributeOptions: Array<{ label: string; value: TimelineLabelProperty }> = [
  // Pick from companies, countries, categories, organising groups, headcount
  {
    label: 'Companies',
    value: 'companies',
  },
  {
    label: 'Countries',
    value: 'countries',
  },
  {
    label: 'Organising Groups',
    value: 'organisingGroups',
  },
  {
    label: 'Categories',
    value: 'categories',
  },
  {
    label: 'Headcount',
    value: 'headcount',
  },
  {
    label: 'Location',
    value: 'location',
  },
  {
    label: 'Name',
    value: 'name',
  },
]

const defaultHighlightedActionAttribute: TimelineLabelProperty = 'categories'

export const Campaigns: CollectionConfig = {
  slug: 'campaigns',
  admin: {
    useAsTitle: 'name',
    description: 'Campaigns that group related actions (e.g. a strike wave or initiative).',
    defaultColumns: ['name', 'createdAt', 'updatedAt'],
    preview: (doc) => {
      if (!doc?.slug || typeof doc.slug !== 'string' || !doc.slug.trim()) {
        return null
      }

      const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
      const slug = doc.slug
      const encodedParams = new URLSearchParams({
        slug,
        collection: 'campaigns',
        path: getPath('campaigns', doc as unknown as Campaign),
        previewSecret,
      })

      return `/preview?${encodedParams.toString()}`
    },
  },
  trash: true,
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
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'description',
      type: 'richText',
      admin: {
        description: 'Go into more detail.',
      },
    },
    {
      name: 'emoji',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Used to illustrate the campaign label.',
      },
    },
    {
      label: 'Actions',
      type: 'group',
      admin: {
        description:
          'Configure which actions to include in this campaign. You can either select individual actions or create a dynamic list of actions based on selected companies, countries, categories, and organising groups.',
      },
      fields: [
        {
          name: 'actions',
          label: 'Actions',
          type: 'relationship',
          relationTo: 'actions',
          hasMany: true,
        },
      ],
    },
    {
      name: 'highlightedActionAttribute',
      type: 'select',
      defaultValue: defaultHighlightedActionAttribute,
      options: highlightedActionAttributeOptions,
      admin: {
        description: 'Select which value to display in the timeline labels for this campaign.',
        position: 'sidebar',
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
            return getPath('campaigns', siblingData as unknown as Campaign)
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
              getPath('campaigns', siblingData as unknown as Campaign),
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
            return `/admin/collections/campaigns/${siblingData.id}`
          },
        ],
      },
    },
    {
      name: 'apiPath',
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
            return `/api/${Campaigns.slug}/${siblingData.id}`
          },
        ],
      },
    },
    {
      name: 'collectionSlug',
      type: 'text',
      virtual: true,
      admin: {
        hidden: true,
        readOnly: true,
      },
      typescriptSchema: [({ jsonSchema }) => ({ ...jsonSchema, type: 'string' })],
      hooks: {
        afterRead: [() => Campaigns.slug],
      },
    },
  ],
}
