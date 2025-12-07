import { colorPickerField } from '@/components/payloadcms/ColourPickerField'
import { getPayload, slugField, type CollectionConfig } from 'payload'
import config from '@/payload.config'
import { projectStrings } from '@/project-strings'
import { getPath } from '@/utils/payloadPath'
import { Campaign, Event } from '@/payload-types'

export const Campaigns: CollectionConfig = {
  slug: 'campaigns',
  trash: true,
  admin: {
    useAsTitle: 'name',
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
      name: 'description',
      type: 'richText',
      admin: {
        description: 'Go into more detail.',
      },
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
      required: true,
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
      name: 'emoji',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Used to illustrate the campaign label.',
      },
    },
    {
      label: 'Events',
      type: 'group',
      admin: {
        description:
          'Configure which events to include in this campaign. You can either select individual events or create a dynamic list of events based on selected companies, countries, categories, and organising groups.',
      },
      fields: [
        {
          name: 'events',
          label: 'Events',
          type: 'relationship',
          relationTo: 'events',
          hasMany: true,
        },
      ],
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
      name: 'eventDateRange',
      type: 'json',
      typescriptSchema: [
        ({ jsonSchema }) => ({
          ...jsonSchema,
          type: 'object',
          properties: {
            start: { type: 'string' },
            end: { type: 'string' },
          },
        }),
      ],
      virtual: true,
      admin: {
        hidden: true,
        readOnly: true,
      },
      hooks: {
        afterRead: [
          async ({ siblingData }) => {
            if (!siblingData.events || !Array.isArray(siblingData.events)) {
              return {
                start: null,
                end: null,
              }
            }

            const payloadConfig = await config
            const payload = await getPayload({ config: payloadConfig })
            const events = await payload.find({
              collection: 'events',
              where: {
                id: {
                  in: siblingData.events as string[],
                },
              },
            })
            const minDate = Math.min(
              ...events.docs.map((event) => {
                if (!event.date) {
                  return Infinity
                }
                return new Date(event.date).getTime()
              }),
            )
            const maxDate = Math.max(
              ...events.docs.map((event) => {
                if (!event.date) {
                  return -Infinity
                }
                return new Date(event.date).getTime()
              }),
            )
            return {
              start: new Date(minDate).toISOString(),
              end: new Date(maxDate).toISOString(),
            }
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
