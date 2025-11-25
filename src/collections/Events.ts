import { slugField, type CollectionConfig } from 'payload'

export const Events: CollectionConfig = {
  slug: 'events',
  trash: true,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'date', 'createdAt', 'updatedAt'],
    preview: (doc) => {
      if (!doc?.slug || typeof doc.slug !== 'string' || !doc.slug.trim()) {
        return null
      }

      const previewSecret = process.env.PAYLOAD_PREVIEW_SECRET || ''
      const slug = doc.slug
      const encodedParams = new URLSearchParams({
        slug,
        collection: 'events',
        path: `/events/${slug}`,
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
    }),
    {
      name: 'title',
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
      name: 'document',
      type: 'upload',
      relationTo: 'media',
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
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
    },
    {
      name: 'relatedEvents',
      type: 'array',
      label: 'Related Events',
      admin: {
        description: 'Create links to related events directly from this event',
      },
      fields: [
        {
          name: 'relatedEvent',
          type: 'relationship',
          relationTo: 'events',
          required: true,
          admin: {
            description: 'The event this is related to',
          },
        },
        {
          name: 'quality',
          type: 'select',
          options: [
            {
              label: 'Direct',
              value: 'DIRECT',
            },
            {
              label: 'Indirect',
              value: 'INDIRECT',
            },
          ],
          required: true,
          defaultValue: 'DIRECT',
          admin: {
            description: 'The quality of the relationship',
          },
        },
        {
          name: 'comment',
          type: 'textarea',
          required: true,
          admin: {
            description:
              'Description of how these events are related (e.g., "The same organiser went on to do this other thing")',
          },
        },
      ],
    },
  ],
}
