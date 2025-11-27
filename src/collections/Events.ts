import { slugField, type CollectionConfig } from 'payload'
import { EventInitiator } from './enums'
import { projectStrings } from '@/project-strings'

function getPath(siblingData: { slug: string }) {
  return `/events/${siblingData.slug}`
}

export const Events: CollectionConfig = {
  slug: 'events',
  trash: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'date', 'createdAt', 'updatedAt'],
    preview: (doc) => {
      if (!doc?.slug || typeof doc.slug !== 'string' || !doc.slug.trim()) {
        return null
      }

      const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
      const slug = doc.slug
      const encodedParams = new URLSearchParams({
        slug,
        collection: 'events',
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
      name: 'airtableId',
      type: 'text',
      unique: true,
      admin: {
        description: 'Legacy Airtable ID for url redirects.',
      },
      hidden: true,
    },
    {
      name: 'source',
      type: 'text',
      admin: {
        description: 'Source of this event.',
      },
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'date',
      type: 'date',
      required: true,
    },
    {
      name: 'location',
      type: 'text',
    },
    {
      name: 'headcount',
      type: 'number',
      admin: {
        description: 'How many workers were involved in, or affected by, this event.',
      },
    },
    {
      name: 'link',
      type: 'text',
    },
    {
      name: 'documents',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
    },
    {
      name: 'initiator',
      type: 'select',
      options: [
        {
          label: 'Worker-led (e.g. an action or worker news)',
          value: EventInitiator.WORKER_LED,
        },
        {
          label: 'Boss-led (e.g. a redundancy or a policy change)',
          value: EventInitiator.BOSS_LED,
        },
        {
          label: 'Other (neither worker-led nor boss-led)',
          value: EventInitiator.OTHER,
        },
      ],
      defaultValue: EventInitiator.WORKER_LED,
      admin: {
        description:
          'Who led this? Used to decide whether to display the event on timelines and so on.',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
    },
    // Relations
    {
      name: 'countries',
      type: 'relationship',
      relationTo: 'countries',
      hasMany: true,
    },
    {
      name: 'companies',
      type: 'relationship',
      relationTo: 'companies',
      hasMany: true,
    },
    {
      name: 'organisingGroups',
      type: 'relationship',
      relationTo: 'organisingGroups',
      hasMany: true,
    },
    {
      name: 'campaigns',
      type: 'join',
      collection: 'campaigns',
      on: 'events',
      admin: {
        description: 'Campaigns this event is part of.',
      },
    },
    {
      name: 'relatedEvents',
      type: 'array',
      label: 'Related events',
      admin: {
        description: 'Link related events and they will appear on the same timeline',
      },
      fields: [
        {
          name: 'event',
          type: 'relationship',
          relationTo: 'events',
          required: true,
          admin: {
            description: 'The event this is related to',
          },
        },
        {
          name: 'connectionType',
          type: 'select',
          options: [
            {
              label: 'Direct (e.g. the same organiser)',
              value: 'DIRECT',
            },
            {
              label: 'Indirect (e.g. inspired by or influenced by)',
              value: 'INDIRECT',
            },
          ],
          required: true,
          defaultValue: 'DIRECT',
          admin: {
            description: 'How are these events related?',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
          admin: {
            description:
              'Description of how these events are related (e.g., "The same organiser went on to do this other thing")',
          },
        },
      ],
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
            return getPath(siblingData as unknown as { slug: string })
          },
        ],
      },
    },
    {
      name: 'url',
      type: 'text',
      virtual: true,
      hidden: true,
      typescriptSchema: [({ jsonSchema }) => ({ ...jsonSchema, type: 'string' })],
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
